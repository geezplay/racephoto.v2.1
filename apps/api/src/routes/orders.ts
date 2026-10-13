import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { createOrderSchema, orderStatusSchema } from '@racephoto/shared';
import { sequelize } from '../config/db';
import { Order, OrderItem, Photo, Event, RecapPhoto, User } from '../models';
import { AuthRequest, admin, optionalAuth, protect } from '../middleware/auth';
import { validate } from '../utils/validate';
import { generateGuestToken, hashToken } from '../utils/token';
import { sendTransactionEmail } from '../services/emailService';

const router = Router();

// GET /orders  (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const { page = '1', limit = '50', status, email } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (email) where.email = { [Op.iLike]: `%${email}%` };

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      orders: orders.map((o) => ({
        id: o.id,
        _id: o.id,
        email: o.email,
        whatsapp: o.whatsapp,
        totalPrice: Number(o.total_price),
        status: o.status,
        createdAt: o.createdAt,
      })),
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /orders/my  (authenticated buyer/admin)
router.get('/my', protect, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user!.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({
      orders: orders.map((o) => ({
        id: o.id,
        email: o.email,
        totalPrice: Number(o.total_price),
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /orders  (public: guest or logged-in buyer)
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const data = validate(createOrderSchema, req.body, res);
  if (!data) return;

  const t = await sequelize.transaction();
  try {
    let totalPrice = 0;
    const orderItems: Array<{
      photo_id: number;
      event_id: number;
      variant: number;
      price: number;
      snap_photo_url: string;
      snap_photo_start_no: string;
      snap_event_name: string;
      snap_photo_class: string;
    }> = [];

    for (const item of data.items) {
      const photo = await Photo.findByPk(item.photoId, {
        include: [{ model: Event, as: 'event' }],
        transaction: t,
      });
      if (!photo) continue;

      const price = Number(photo.price);
      totalPrice += price;
      orderItems.push({
        photo_id: photo.id,
        event_id: photo.event_id,
        variant: item.variant || 1,
        price,
        snap_photo_start_no: photo.start_no,
        snap_photo_url: photo.url,
        snap_event_name: (photo as unknown as { event?: Event }).event?.name || '',
        snap_photo_class: photo.class || '',
      });
    }

    if (orderItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Tidak ada foto valid di keranjang' });
    }

    // Discount
    let discountAmount = 0;
    let appliedCode: string | null = null;
    if (data.discountCode) {
      const DiscountCode = (await import('../models/DiscountCode')).DiscountCode;
      const discount = await DiscountCode.findOne({
        where: { code: data.discountCode.toUpperCase().trim() },
        transaction: t,
      });
      if (discount && discount.is_active) {
        const notExpired = !discount.valid_until || new Date(discount.valid_until) >= new Date();
        const withinLimit = !discount.usage_limit || discount.used_count < discount.usage_limit;
        if (notExpired && withinLimit) {
          let eligible = [...orderItems];
          if (discount.event_ids && discount.event_ids.length > 0) {
            eligible = eligible.filter((i) => discount.event_ids!.includes(Number(i.event_id)));
          }
          if (discount.max_photos && eligible.length > discount.max_photos) {
            eligible = eligible.slice(0, discount.max_photos);
          }
          const eligibleSubtotal = eligible.reduce((sum, i) => sum + i.price, 0);
          discountAmount =
            discount.discount_type === 'percent'
              ? Math.floor((eligibleSubtotal * discount.discount_value) / 100)
              : Math.min(discount.discount_value, eligibleSubtotal);
          discountAmount = Math.min(discountAmount, totalPrice);
          appliedCode = discount.code;
          discount.used_count += 1;
          await discount.save({ transaction: t });
        }
      }
    }

    const finalPrice = Math.max(0, totalPrice - discountAmount);
    const userId = req.user ? req.user.id : null;
    // Guest orders (user_id null) must always carry a token; logged-in orders keep null.
    const guestToken = userId == null ? generateGuestToken() : null;

    const order = await Order.create(
      {
        email: data.email,
        whatsapp: data.whatsapp || '',
        total_price: finalPrice,
        status: 'pending',
        discount_code: appliedCode,
        discount_amount: discountAmount,
        user_id: userId,
        guest_token: guestToken ? hashToken(guestToken) : null,
      },
      { transaction: t },
    );

    for (const item of orderItems) {
      await OrderItem.create({ ...item, order_id: order.id }, { transaction: t });
    }

    await t.commit();

    res.status(201).json({
      _id: order.id,
      id: order.id,
      orderId: order.id,
      order_id: order.id,
      email: order.email,
      totalPrice: Number(order.total_price),
      subtotal: totalPrice,
      discountCode: appliedCode,
      discountAmount,
      status: order.status,
      // Raw token returned once; the client stores it to access the order later.
      guest_token: guestToken,
    });
  } catch (error) {
    await t.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /orders/:id  (owner / guest token / admin)
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Photo, as: 'photo', include: [{ model: RecapPhoto, as: 'recaps' }] }],
        },
      ],
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isAdmin = !!req.user && req.user.isAdmin();
    const isOwner = !!req.user && order.user_id != null && order.user_id === req.user.id;
    const isGuest = !!token && order.guest_token != null && order.guest_token === hashToken(token);
    if (!isAdmin && !isOwner && !isGuest) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const items = (order as unknown as { items?: OrderItem[] }).items || [];

    res.json({
      _id: order.id,
      id: order.id,
      email: order.email,
      whatsapp: order.whatsapp,
      totalPrice: Number(order.total_price),
      status: order.status,
      items: items.map((item) => {
        const photo = (item as unknown as { photo?: Photo & { recaps?: RecapPhoto[] } }).photo;
        const recapPhoto = photo?.recaps?.find((r) => r.variant_number === item.variant);
        const photoUrl = item.snap_photo_url || photo?.url || null;
        return {
          id: item.id,
          photoId: item.photo_id,
          variant: item.variant,
          price: item.price,
          startNo: item.snap_photo_start_no,
          photoUrl,
          eventName: item.snap_event_name,
          recapUrl: recapPhoto ? `/uploads/recaps/${recapPhoto.getDataValue('file_path')}` : null,
          mainPhotoUrl: photoUrl,
        };
      }),
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /orders/:id/status  (admin only)
router.put('/:id/status', protect, admin, async (req, res) => {
  const data = validate(orderStatusSchema, req.body, res);
  if (!data) return;

  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items', include: [{ model: Photo, as: 'photo', attributes: ['id', 'created_by'] }] }],
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const previousStatus = order.status;
    order.status = data.status;
    await order.save();

    if (data.status === 'success' && previousStatus !== 'success') {
      const items = (order as unknown as { items?: OrderItem[] }).items || [];
      try {
        const ownerEarnings: Record<number, number> = {};
        for (const item of items) {
          const ownerId = (item as unknown as { photo?: { created_by: number | null } }).photo?.created_by;
          if (ownerId) ownerEarnings[ownerId] = (ownerEarnings[ownerId] || 0) + Number(item.price);
        }
        for (const [ownerId, earnings] of Object.entries(ownerEarnings)) {
          const owner = await User.findByPk(Number(ownerId));
          if (owner) {
            owner.balance = (owner.balance || 0) + earnings;
            await owner.save();
          }
        }
      } catch (balanceError) {
        console.error('Failed to update balance:', balanceError);
      }

      try {
        const fullOrder = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
        if (fullOrder) {
          const fullItems = (fullOrder as unknown as { items?: OrderItem[] }).items || [];
          const result = await sendTransactionEmail(fullOrder, fullItems);
          console.log('Email result:', result);
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    res.json({ message: 'Status updated', status: order.status });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /orders/:id/send-email  (admin only)
router.post('/:id/send-email', protect, admin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'success') return res.status(400).json({ message: 'Order payment not completed' });

    const items = (order as unknown as { items?: OrderItem[] }).items || [];
    const result = await sendTransactionEmail(order, items);
    if (result.success) {
      res.json({ message: 'Email sent successfully', messageId: result.messageId });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
