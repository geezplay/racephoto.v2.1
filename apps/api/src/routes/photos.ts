import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import { Photo, Event, RecapPhoto, Order, OrderItem, ClassPreview } from '../models';
import { AuthRequest, optionalAuth, protect, admin } from '../middleware/auth';
import { hashToken } from '../utils/token';

const router = Router();

// GET /photos
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '50', eventId, className, startNo, search } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (eventId) where.event_id = eventId;
    if (className) where.class = decodeURIComponent(className);
    if (startNo) where.start_no = { [Op.iLike]: `%${startNo}%` };
    if (search) {
      where[Op.or as unknown as string] = [
        { start_no: { [Op.iLike]: `%${search}%` } },
        { class: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: photos } = await Photo.findAndCountAll({
      where,
      include: [
        { model: Event, as: 'event', attributes: ['id', 'name', 'date', 'status'] },
        { model: RecapPhoto, as: 'recaps' },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    const photosWithDetails = photos.map((p) => {
      const recaps = (p as unknown as { recaps?: RecapPhoto[] }).recaps;
      const event = (p as unknown as { event?: Event }).event;
      return {
        id: p.id,
        startNo: p.start_no,
        class: p.class,
        price: Number(p.price),
        photoUrl: p.photoUrl,
        recapCount: recaps?.length || 0,
        event: event ? { id: event.id, name: event.name, date: event.date, status: event.status } : null,
        createdAt: p.createdAt,
      };
    });

    res.json({
      photos: photosWithDetails,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Get all photos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /photos/event/:eventId/class/:className
router.get('/event/:eventId/class/:className', async (req, res) => {
  try {
    const { eventId, className } = req.params;
    const { startNo, page = '1', limit = '50' } = req.query as Record<string, string>;

    const event = await Event.findByPk(eventId);
    if (!event || event.status !== 'approved') {
      return res.status(404).json({ message: 'Event not found' });
    }

    const decodedClass = decodeURIComponent(className);
    const where: Record<string, unknown> = { event_id: eventId, class: decodedClass };
    if (startNo) where.start_no = { [Op.iLike]: `%${startNo}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const photos = await Photo.findAll({
      where,
      include: [{ model: RecapPhoto, as: 'recaps' }],
      limit: parseInt(limit),
      offset,
      order: [['start_no', 'ASC']],
    });

    const allPhotos = await Photo.findAll({
      where: { event_id: eventId, class: decodedClass },
      attributes: ['start_no'],
      group: ['start_no'],
      order: [['start_no', 'ASC']],
    });
    const startNumbers = allPhotos.map((p) => p.start_no);

    const preview = await ClassPreview.findOne({ where: { event_id: eventId, class_name: decodedClass } });

    const photosWithDetails = photos.map((p) => {
      const recaps = (p as unknown as { recaps?: RecapPhoto[] }).recaps;
      return {
        ...p.toJSON(),
        startNo: p.start_no,
        price: Number(p.price),
        photoUrl: p.photoUrl,
        recapCount: recaps?.length || 0,
        eventId: { name: event.name },
      };
    });

    res.json({
      photos: photosWithDetails,
      event: { ...event.toJSON(), imageUrl: event.imageUrl },
      startNumbers,
      previewUrl: preview?.previewUrl || null,
      previewUpdatedAt: preview?.generated_at || null,
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /photos/:id
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findByPk(req.params.id, {
      include: [
        { model: Event, as: 'event' },
        { model: RecapPhoto, as: 'recaps' },
      ],
    });

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const recaps = ((photo as unknown as { recaps?: RecapPhoto[] }).recaps || []).map((r) => ({
      id: r.id,
      variant_number: r.variant_number,
      url: r.url,
    }));

    res.json({
      ...photo.toJSON(),
      startNo: photo.start_no,
      price: Number(photo.price),
      photoUrl: photo.photoUrl,
      recapCount: recaps.length,
      recaps,
    });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /photos/download/:type/:id  (admin only)
router.get('/download/:type/:id', protect, admin, async (req, res) => {
  try {
    const { type, id } = req.params;
    let filePath: string;
    let filename: string;

    if (type === 'recap') {
      const recap = await RecapPhoto.findByPk(id);
      if (!recap) return res.status(404).json({ message: 'Recap not found' });
      filePath = path.join(__dirname, '..', '..', 'uploads', 'recaps', recap.getDataValue('file_path'));
      filename = `recap-v${recap.variant_number}-${id}.jpg`;
    } else if (type === 'photo') {
      const photo = await Photo.findByPk(id);
      if (!photo) return res.status(404).json({ message: 'Photo not found' });
      const rawPath = photo.getDataValue('url');
      filePath = path.join(__dirname, '..', '..', rawPath);
      filename = `photo-${photo.start_no}-${id}.jpg`;
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

// GET /photos/download-by-order/:orderId/:itemIndex
// Allowed for admins, the owning buyer, or a guest presenting the order token.
router.get('/download-by-order/:orderId/:itemIndex', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const token = typeof req.query.token === 'string' ? req.query.token : null;

    const order = await Order.findByPk(orderId, {
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

    if (order.status !== 'success') {
      return res.status(403).json({ message: 'Payment not completed' });
    }

    const items = (order as unknown as { items?: OrderItem[] }).items || [];
    const item = items[parseInt(itemIndex)];
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const photo = (item as unknown as { photo?: Photo & { recaps?: RecapPhoto[] } }).photo;
    const recapPhoto = photo?.recaps?.find((r) => r.variant_number === item.variant);

    let filePath: string;
    let filename: string;

    if (recapPhoto) {
      const rawPath = recapPhoto.getDataValue('file_path');
      filePath = path.join(__dirname, '..', '..', 'uploads', 'recaps', rawPath);
      filename = `foto-${item.snap_photo_start_no || item.photo_id}-v${item.variant}.jpg`;
    } else if (photo) {
      const rawPath = photo.getDataValue('url');
      filePath = path.join(__dirname, '..', '..', rawPath);
      filename = `foto-${item.snap_photo_start_no || item.photo_id}.jpg`;
    } else {
      return res.status(404).json({ message: 'Photo file not found' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

export default router;
