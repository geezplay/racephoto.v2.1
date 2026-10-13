import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import { z } from 'zod';
import { CATEGORY_LABELS, EventCategory } from '@racephoto/shared';
import { sequelize } from '../config/db';
import {
  User,
  Event,
  EventClass,
  Photo,
  RecapPhoto,
  ClassPreview,
  PhotoPreview,
  Order,
  OrderItem,
  Sponsor,
  Photographer,
  WithdrawalRequest,
  SiteSetting,
} from '../models';
import { validate } from '../utils/validate';
import { regenerateClassPreview, getClassPreview, listClassPreviews } from '../services/classPreviewService';
import { regeneratePhotoPreview, getPhotoPreview } from '../services/photoPreviewService';
import { AuthRequest, protect, admin, superAdmin } from '../middleware/auth';
import {
  uploadEvent,
  uploadPhoto,
  uploadRecap,
  uploadSponsor,
  uploadPhotographer,
  uploadSettings,
} from '../middleware/upload';

const router = Router();

const uploadsDir = (): string => path.join(__dirname, '..', '..', 'uploads');

const recapsOf = (photo: Photo): RecapPhoto[] => (photo as unknown as { recaps?: RecapPhoto[] }).recaps || [];
const itemsOf = (order: Order): OrderItem[] => (order as unknown as { items?: OrderItem[] }).items || [];

function dirSize(dir: string): number {
  let size = 0;
  try {
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      size += stats.isDirectory() ? dirSize(filePath) : stats.size;
    }
  } catch {
    // ignore unreadable directories
  }
  return size;
}

router.use(protect);
router.use(admin);

// ==================== DASHBOARD ====================
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const isSuper = user.isSuperAdmin();
    const userId = user.id;

    const totalEvents = await Event.count({ where: isSuper ? {} : { created_by: userId } });
    const totalPhotos = await Photo.count({ where: isSuper ? {} : { created_by: userId } });

    let totalOrders = 0;
    let totalRevenue = 0;

    if (isSuper) {
      totalOrders = await Order.count({ where: { status: 'success' } });
      const revenueResult = await Order.sum('total_price', { where: { status: 'success' } });
      totalRevenue = revenueResult || 0;
    } else {
      const adminOrderItems = await OrderItem.findAll({
        include: [
          { model: Photo, as: 'photo', where: { created_by: userId }, attributes: ['id', 'created_by'] },
          { model: Order, as: 'order', where: { status: 'success' }, attributes: ['id'] },
        ],
        attributes: ['id', 'price'],
      });
      totalRevenue = adminOrderItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
      const uniqueOrderIds = new Set(
        adminOrderItems.map((item) => (item as unknown as { order?: { id: number } }).order?.id).filter(Boolean),
      );
      totalOrders = uniqueOrderIds.size;
    }

    const storageUsed = fs.existsSync(uploadsDir()) ? dirSize(uploadsDir()) : 0;

    const recentOrders = await Order.findAll({
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.json({
      totalEvents,
      totalPhotos,
      totalOrders,
      totalRevenue: Number(totalRevenue),
      userBalance: Number(user.balance),
      storageUsed,
      recentOrders: recentOrders.map((o) => ({
        _id: o.id,
        email: o.email,
        totalPrice: Number(o.total_price),
        status: o.status,
        items: itemsOf(o),
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== TRANSACTIONS ====================
router.get('/transactions', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const { status, event, className, limit = '20', page = '1' } = req.query as Record<string, string>;
    const isSuper = user.isSuperAdmin();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const orders = await Order.findAll({
      where,
      attributes: ['id', 'email', 'whatsapp', 'total_price', 'status', 'snap_token', 'createdAt', 'updatedAt'],
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Photo,
              as: 'photo',
              attributes: ['id', 'start_no', 'class', 'price', 'url', 'created_by', 'event_id'],
              include: [
                { model: Event, as: 'event', attributes: ['id', 'name'] },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    let filteredOrders = orders;
    if (!isSuper) {
      filteredOrders = orders
        .filter((order) => itemsOf(order).some((item) => (item as unknown as { photo?: { created_by: number } }).photo?.created_by === user.id))
        .map((order) => {
          const data = order.toJSON() as unknown as Record<string, unknown>;
          data.items = itemsOf(order).filter((item) => (item as unknown as { photo?: { created_by: number } }).photo?.created_by === user.id);
          return data as unknown as Order;
        });
    }

    let result = filteredOrders.map((o) => {
      const orderData = o.toJSON() as unknown as Record<string, unknown>;
      const items = (orderData.items as Array<Record<string, unknown>>) || [];
      return {
        id: orderData.id as number,
        _id: orderData.id as number,
        email: orderData.email as string,
        whatsapp: orderData.whatsapp as string,
        totalPrice: Number(orderData.total_price),
        total_price: Number(orderData.total_price),
        status: orderData.status as string,
        items: items.map((item) => {
          const photo = item.photo as Record<string, unknown> | undefined;
          return {
            id: item.id,
            variant: item.variant,
            price: item.price,
            snap_photo_url: item.snap_photo_url,
            snap_photo_start_no: item.snap_photo_start_no,
            snap_event_name: item.snap_event_name,
            snap_photo_class: item.snap_photo_class,
            photo: photo
              ? {
                  id: photo.id,
                  start_no: photo.start_no,
                  class: photo.class,
                  url: photo.url,
                  event_name: (photo.event as Record<string, unknown> | undefined)?.name || null,
                  event_id: photo.event_id,
                  creator_name: (photo.creator as Record<string, unknown> | undefined)?.name || null,
                  creator_email: (photo.creator as Record<string, unknown> | undefined)?.email || null,
                }
              : null,
          };
        }),
        createdAt: orderData.createdAt,
        created_at: orderData.createdAt,
      };
    });

    if (event) {
      const ev = event.toLowerCase();
      result = result.filter((order) =>
        order.items.some(
          (item) =>
            (item.snap_event_name && String(item.snap_event_name).toLowerCase().includes(ev)) ||
            (item.photo?.event_name && String(item.photo.event_name).toLowerCase().includes(ev)),
        ),
      );
    }

    if (className) {
      const cn = className.toLowerCase();
      result = result.filter((order) =>
        order.items.some(
          (item) =>
            (item.snap_photo_class && String(item.snap_photo_class).toLowerCase().includes(cn)) ||
            (item.photo?.class && String(item.photo.class).toLowerCase().includes(cn)),
        ),
      );
    }

    const allEvents = new Set<string>();
    const allClasses = new Set<string>();
    result.forEach((order) => {
      order.items.forEach((item) => {
        if (item.snap_event_name) allEvents.add(String(item.snap_event_name));
        if (item.photo?.event_name) allEvents.add(String(item.photo.event_name));
        if (item.snap_photo_class) allClasses.add(String(item.snap_photo_class));
        if (item.photo?.class) allClasses.add(String(item.photo.class));
      });
    });

    res.json({
      orders: result,
      filters: {
        events: Array.from(allEvents).filter(Boolean),
        classes: Array.from(allClasses).filter(Boolean),
      },
    });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== EVENTS ====================
router.get('/events', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const where = user.isSuperAdmin() ? {} : { created_by: user.id };
    const events = await Event.findAll({
      where,
      include: [
        { model: EventClass, as: 'classes' },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC']],
    });
    res.json(events.map((e) => ({ ...e.toJSON(), _id: e.id, imageUrl: e.imageUrl })));
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/events/all/approved', async (_req, res) => {
  try {
    const events = await Event.findAll({
      where: { status: 'approved' },
      include: [
        { model: EventClass, as: 'classes' },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC']],
    });
    res.json(events.map((e) => ({ ...e.toJSON(), _id: e.id, imageUrl: e.imageUrl })));
  } catch (error) {
    console.error('Get approved events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/events/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const event = await Event.findByPk(req.params.id, { include: [{ model: EventClass, as: 'classes' }] });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!user.isSuperAdmin() && event.created_by !== user.id && event.status !== 'approved') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ ...event.toJSON(), _id: event.id, imageUrl: event.imageUrl });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/events', uploadEvent.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const { name, date, location } = req.body as { name: string; date?: string; location: string };
    const event = await Event.create({
      name,
      date: date || null,
      location,
      image: req.file?.filename || null,
      status: user.isSuperAdmin() ? 'approved' : 'pending',
      created_by: user.id,
    });
    res.status(201).json({ ...event.toJSON(), _id: event.id, imageUrl: event.imageUrl });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/events/:id', uploadEvent.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!user.isSuperAdmin() && event.created_by !== user.id) return res.status(403).json({ message: 'Access denied' });

    const { name, date, location } = req.body as { name?: string; date?: string; location?: string };
    event.name = name || event.name;
    event.date = date || event.date;
    event.location = location || event.location;
    if (req.file) event.image = req.file.filename;
    await event.save();
    res.json({ ...event.toJSON(), _id: event.id, imageUrl: event.imageUrl });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/events/:id', async (req: AuthRequest, res: Response) => {
  const user = req.user as User;
  const t = await sequelize.transaction();
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!user.isSuperAdmin() && event.created_by !== user.id) return res.status(403).json({ message: 'Access denied' });

    const photos = await Photo.findAll({ where: { event_id: event.id }, include: [{ model: RecapPhoto, as: 'recaps' }] });
    let deletedPhotos = 0;
    let deletedRecaps = 0;
    let deletedFiles = 0;
    const photoIds: number[] = [];

    for (const photo of photos) {
      await OrderItem.update({ photo_id: null }, { where: { photo_id: photo.id }, transaction: t });
      photoIds.push(photo.id);
      for (const recap of recapsOf(photo)) {
        try {
          const recapFile = path.join(uploadsDir(), 'recaps', recap.file_path);
          if (fs.existsSync(recapFile)) {
            fs.unlinkSync(recapFile);
            deletedFiles++;
          }
        } catch (e) {
          console.warn(`Failed to delete recap file: ${recap.file_path}`, (e as Error).message);
        }
      }
      await RecapPhoto.destroy({ where: { photo_id: photo.id }, transaction: t });
      deletedRecaps += recapsOf(photo).length;
      try {
        const photoFile = path.join(uploadsDir(), 'photos', path.basename(photo.url || ''));
        if (photoFile && fs.existsSync(photoFile)) {
          fs.unlinkSync(photoFile);
          deletedFiles++;
        }
      } catch (e) {
        console.warn(`Failed to delete photo file: ${photo.url}`, (e as Error).message);
      }
      deletedPhotos++;
    }

    await Photo.destroy({ where: { event_id: event.id }, transaction: t });
    await EventClass.destroy({ where: { event_id: event.id }, transaction: t });

    const previews = await ClassPreview.findAll({ where: { event_id: event.id } });
    for (const preview of previews) {
      try {
        if (preview.file_path) {
          const previewFile = path.join(uploadsDir(), 'previews', preview.file_path);
          if (fs.existsSync(previewFile)) {
            fs.unlinkSync(previewFile);
            deletedFiles++;
          }
        }
      } catch (e) {
        console.warn(`Failed to delete preview file: ${preview.file_path}`, (e as Error).message);
      }
    }
    await ClassPreview.destroy({ where: { event_id: event.id }, transaction: t });

    if (photoIds.length > 0) {
      const photoPreviews = await PhotoPreview.findAll({ where: { photo_id: { [Op.in]: photoIds } } });
      for (const preview of photoPreviews) {
        try {
          if (preview.file_path) {
            const previewFile = path.join(uploadsDir(), 'previews', preview.file_path);
            if (fs.existsSync(previewFile)) {
              fs.unlinkSync(previewFile);
              deletedFiles++;
            }
          }
        } catch (e) {
          console.warn(`Failed to delete preview file: ${preview.file_path}`, (e as Error).message);
        }
      }
      await PhotoPreview.destroy({ where: { photo_id: { [Op.in]: photoIds } }, transaction: t });
    }

    if (event.image) {
      try {
        const eventImage = path.join(uploadsDir(), 'events', event.image);
        if (fs.existsSync(eventImage)) {
          fs.unlinkSync(eventImage);
          deletedFiles++;
        }
      } catch (e) {
        console.warn(`Failed to delete event image: ${event.image}`, (e as Error).message);
      }
    }

    await event.destroy({ transaction: t });
    await t.commit();

    res.json({
      message: `Event "${event.name}" berhasil dihapus beserta ${deletedPhotos} foto dan ${deletedRecaps} varian`,
      deletedPhotos,
      deletedRecaps,
      deletedFiles,
    });
  } catch (error) {
    await t.rollback();
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error: ' + (error as Error).message });
  }
});

// ==================== CLASSES ====================
router.post('/events/:eventId/classes', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const event = await Event.findByPk(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!user.isSuperAdmin() && event.created_by !== user.id) return res.status(403).json({ message: 'Access denied' });

    const { name } = req.body as { name: string };
    const eventClass = await EventClass.create({ event_id: Number(req.params.eventId), name });
    res.status(201).json({ ...eventClass.toJSON(), _id: eventClass.id });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/classes/:id', async (_req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const eventClass = await EventClass.findByPk(_req.params.id);
    if (!eventClass) return res.status(404).json({ message: 'Class not found' });

    const photos = await Photo.findAll({
      where: { event_id: eventClass.event_id, class: eventClass.name },
      include: [{ model: RecapPhoto, as: 'recaps' }],
    });
    let deletedPhotos = 0;
    let deletedRecaps = 0;
    let deletedFiles = 0;
    const photoIds: number[] = [];

    for (const photo of photos) {
      await OrderItem.update({ photo_id: null }, { where: { photo_id: photo.id }, transaction: t });
      photoIds.push(photo.id);
      for (const recap of recapsOf(photo)) {
        try {
          const recapFile = path.join(uploadsDir(), 'recaps', recap.file_path);
          if (fs.existsSync(recapFile)) {
            fs.unlinkSync(recapFile);
            deletedFiles++;
          }
        } catch (e) {
          console.warn(`Failed to delete recap file: ${recap.file_path}`, (e as Error).message);
        }
      }
      await RecapPhoto.destroy({ where: { photo_id: photo.id }, transaction: t });
      deletedRecaps += recapsOf(photo).length;
      try {
        const photoFile = path.join(uploadsDir(), 'photos', path.basename(photo.url || ''));
        if (photoFile && fs.existsSync(photoFile)) {
          fs.unlinkSync(photoFile);
          deletedFiles++;
        }
      } catch (e) {
        console.warn(`Failed to delete photo file: ${photo.url}`, (e as Error).message);
      }
      deletedPhotos++;
    }

    await Photo.destroy({ where: { event_id: eventClass.event_id, class: eventClass.name }, transaction: t });
    await eventClass.destroy({ transaction: t });
    await t.commit();

    try {
      const previews = await ClassPreview.findAll({
        where: { event_id: eventClass.event_id, class_name: eventClass.name },
      });
      for (const preview of previews) {
        if (preview.file_path) {
          const previewFile = path.join(uploadsDir(), 'previews', preview.file_path);
          if (fs.existsSync(previewFile)) fs.unlinkSync(previewFile);
        }
        await preview.destroy();
      }

      if (photoIds.length > 0) {
        const photoPreviews = await PhotoPreview.findAll({ where: { photo_id: { [Op.in]: photoIds } } });
        for (const preview of photoPreviews) {
          if (preview.file_path) {
            const previewFile = path.join(uploadsDir(), 'previews', preview.file_path);
            if (fs.existsSync(previewFile)) fs.unlinkSync(previewFile);
          }
          await preview.destroy();
        }
      }
    } catch (e) {
      console.warn('Failed to delete class preview:', (e as Error).message);
    }

    res.json({
      message: `Kelas "${eventClass.name}" berhasil dihapus beserta ${deletedPhotos} foto`,
      deletedPhotos,
      deletedRecaps,
      deletedFiles,
    });
  } catch (error) {
    await t.rollback();
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error: ' + (error as Error).message });
  }
});

// ==================== PHOTOS ====================
router.get('/photos', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const where = user.isSuperAdmin() ? {} : { created_by: user.id };
    const photos = await Photo.findAll({
      where,
      include: [
        { model: Event, as: 'event' },
        { model: RecapPhoto, as: 'recaps' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(
      photos.map((p) => ({
        ...p.toJSON(),
        _id: p.id,
        startNo: p.start_no,
        price: Number(p.price),
        photoUrl: p.photoUrl,
        event_name: (p as unknown as { event?: Event }).event?.name,
        class: p.class,
        recap_count: recapsOf(p).length,
      })),
    );
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/photos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const photo = await Photo.findByPk(req.params.id, {
      include: [
        { model: Event, as: 'event' },
        { model: RecapPhoto, as: 'recaps' },
        { model: PhotoPreview, as: 'variantPreview' },
      ],
    });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (!user.isSuperAdmin() && photo.created_by !== user.id) return res.status(403).json({ message: 'Access denied' });

    const recapsWithUrls = recapsOf(photo).map((r) => ({
      id: r.id,
      variant_number: r.variant_number,
      file_path: r.file_path,
      url: `/uploads/recaps/${r.file_path}`,
    }));

    res.json({
      ...photo.toJSON(),
      _id: photo.id,
      startNo: photo.start_no,
      price: Number(photo.price),
      photoUrl: photo.photoUrl,
      recaps: recapsWithUrls,
      variantPreviewUrl: (photo as any).variantPreview?.previewUrl || null,
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/photos', uploadPhoto.single('photo'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const { eventId, class: photoClass, startNo, price } = req.body as {
      eventId: string;
      class: string;
      startNo: string;
      price: string;
    };
    if (!req.file) return res.status(400).json({ message: 'Photo file required' });

    const photo = await Photo.create({
      event_id: Number(eventId),
      class: photoClass,
      start_no: startNo,
      price: Number(price),
      url: `/uploads/photos/${req.file.filename}`,
      created_by: user.id,
    });
    void regenerateClassPreview(photo.event_id, photo.class);
    res.status(201).json({ ...photo.toJSON(), _id: photo.id, photoUrl: photo.photoUrl });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/photos/:id', uploadPhoto.single('photo'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const photo = await Photo.findByPk(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (!user.isSuperAdmin() && photo.created_by !== user.id) return res.status(403).json({ message: 'Access denied' });

    const { eventId, class: photoClass, startNo, price } = req.body as {
      eventId?: string;
      class?: string;
      startNo?: string;
      price?: string;
    };
    const oldEventId = photo.event_id;
    const oldClass = photo.class;
    if (eventId) photo.event_id = Number(eventId);
    if (photoClass) photo.class = photoClass;
    if (startNo) photo.start_no = startNo;
    if (price) photo.price = Number(price);
    if (req.file) photo.url = `/uploads/photos/${req.file.filename}`;
    await photo.save();
    void regenerateClassPreview(photo.event_id, photo.class);
    if (photo.event_id !== oldEventId || photo.class !== oldClass) {
      void regenerateClassPreview(oldEventId, oldClass);
    }
    res.json({ ...photo.toJSON(), _id: photo.id });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/photos/:id', async (req: AuthRequest, res: Response) => {
  const user = req.user as User;
  const t = await sequelize.transaction();
  try {
    const photo = await Photo.findByPk(req.params.id, { include: [{ model: RecapPhoto, as: 'recaps' }] });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (!user.isSuperAdmin() && photo.created_by !== user.id) return res.status(403).json({ message: 'Access denied' });

    const previewEventId = photo.event_id;
    const previewClass = photo.class;

    let deletedFiles = 0;
    await OrderItem.update({ photo_id: null }, { where: { photo_id: photo.id }, transaction: t });

    for (const recap of recapsOf(photo)) {
      try {
        const recapFile = path.join(uploadsDir(), 'recaps', recap.file_path);
        if (fs.existsSync(recapFile)) {
          fs.unlinkSync(recapFile);
          deletedFiles++;
        }
      } catch (e) {
        console.warn(`Failed to delete recap file: ${recap.file_path}`, (e as Error).message);
      }
    }
    await RecapPhoto.destroy({ where: { photo_id: photo.id }, transaction: t });

    try {
      const photoFile = path.join(uploadsDir(), 'photos', path.basename(photo.url || ''));
      if (photoFile && fs.existsSync(photoFile)) {
        fs.unlinkSync(photoFile);
        deletedFiles++;
      }
    } catch (e) {
      console.warn(`Failed to delete photo file: ${photo.url}`, (e as Error).message);
    }

    const photoPreview = await PhotoPreview.findOne({ where: { photo_id: photo.id } });
    if (photoPreview?.file_path) {
      try {
        const previewFile = path.join(uploadsDir(), 'previews', photoPreview.file_path);
        if (fs.existsSync(previewFile)) {
          fs.unlinkSync(previewFile);
          deletedFiles++;
        }
      } catch (e) {
        console.warn(`Failed to delete preview file: ${photoPreview.file_path}`, (e as Error).message);
      }
    }
    await PhotoPreview.destroy({ where: { photo_id: photo.id }, transaction: t });

    await photo.destroy({ transaction: t });
    await t.commit();
    void regenerateClassPreview(previewEventId, previewClass);
    res.json({ message: 'Foto berhasil dihapus', deletedFiles });
  } catch (error) {
    await t.rollback();
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Server error: ' + (error as Error).message });
  }
});

// ==================== RECAPS ====================
router.post('/photos/:photoId/recaps', uploadRecap.array('recaps', 50), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const photo = await Photo.findByPk(req.params.photoId);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (!user.isSuperAdmin() && photo.created_by !== user.id) {
      return res.status(403).json({ message: 'Access denied. Only photo owner can upload recaps.' });
    }

    const files = (req.files as Express.Multer.File[]) || [];
    const existingCount = await RecapPhoto.count({ where: { photo_id: req.params.photoId } });

    const recaps: RecapPhoto[] = [];
    let counter = existingCount;
    for (const file of files) {
      counter++;
      recaps.push(
        await RecapPhoto.create({
          photo_id: Number(req.params.photoId),
          file_path: file.filename,
          variant_number: counter,
        }),
      );
    }
    res.status(201).json(recaps);
    void regenerateClassPreview(photo.event_id, photo.class);
    void regeneratePhotoPreview(Number(req.params.photoId));
  } catch (error) {
    console.error('Upload recaps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/recaps/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const recap = await RecapPhoto.findByPk(req.params.id, {
      include: [{ model: Photo, as: 'photo', attributes: ['id', 'created_by', 'event_id', 'class'] }],
    });
    if (!recap) return res.status(404).json({ message: 'Recap not found' });

    const recapPhoto = (recap as unknown as { photo?: Photo }).photo;
    const ownerId = recapPhoto?.created_by;
    if (!user.isSuperAdmin() && ownerId !== user.id) return res.status(403).json({ message: 'Access denied' });

    // Remove the physical file alongside the DB row.
    try {
      const recapFile = path.join(uploadsDir(), 'recaps', recap.getDataValue('file_path'));
      if (fs.existsSync(recapFile)) fs.unlinkSync(recapFile);
    } catch (e) {
      console.warn('Failed to delete recap file:', (e as Error).message);
    }

    await recap.destroy();
    if (recapPhoto) void regenerateClassPreview(recapPhoto.event_id, recapPhoto.class);
    void regeneratePhotoPreview(recap.photo_id);
    res.json({ message: 'Recap deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== CLASS PREVIEWS ====================
const classPreviewSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  className: z.string().min(1),
});

const serializeClassPreview = (preview: ClassPreview) => ({
  id: preview.id,
  eventId: preview.event_id,
  className: preview.class_name,
  previewUrl: preview.previewUrl,
  photoCount: preview.photo_count,
  previewUpdatedAt: preview.generated_at,
  failedAt: preview.failed_at,
  error: preview.error,
});

router.get('/class-previews', async (req: AuthRequest, res: Response) => {
  try {
    const eventIdRaw = req.query.eventId;
    const eventId = eventIdRaw !== undefined ? Number(eventIdRaw) : undefined;
    const previews = await listClassPreviews(Number.isFinite(eventId) ? eventId : undefined);
    res.json(previews.map(serializeClassPreview));
  } catch (error) {
    console.error('List class previews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/class-previews/regenerate', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = validate(classPreviewSchema, req.body, res);
    if (!parsed) return;
    await regenerateClassPreview(parsed.eventId, parsed.className);
    const preview = await getClassPreview(parsed.eventId, parsed.className);
    res.json({ success: true, preview: preview ? serializeClassPreview(preview) : null });
  } catch (error) {
    console.error('Regenerate class preview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const serializeVariantPreview = (preview: PhotoPreview) => ({
  id: preview.id,
  photoId: preview.photo_id,
  previewUrl: preview.previewUrl,
  variantCount: preview.variant_count,
  previewUpdatedAt: preview.generated_at,
  failedAt: preview.failed_at,
  error: preview.error,
});

router.get('/photos/:photoId/variant-preview', async (req: AuthRequest, res: Response) => {
  try {
    const preview = await getPhotoPreview(Number(req.params.photoId));
    res.json({ preview: preview ? serializeVariantPreview(preview) : null });
  } catch (error) {
    console.error('Get variant preview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/photos/:photoId/variant-preview', async (req: AuthRequest, res: Response) => {
  try {
    const photoId = Number(req.params.photoId);
    if (!Number.isFinite(photoId) || photoId <= 0) {
      return res.status(400).json({ message: 'Invalid photoId' });
    }
    await regeneratePhotoPreview(photoId);
    const preview = await getPhotoPreview(photoId);
    res.json({ success: true, preview: preview ? serializeVariantPreview(preview) : null });
  } catch (error) {
    console.error('Regenerate variant preview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PENDING EVENTS ====================
router.get('/pending-events', superAdmin, async (_req, res) => {
  try {
    const events = await Event.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']],
    });
    res.json(events.map((e) => ({ ...e.toJSON(), _id: e.id, imageUrl: e.imageUrl })));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/events/:id/approve', superAdmin, async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  event.status = 'approved';
  await event.save();
  res.json({ message: 'Event approved' });
});

router.post('/events/:id/reject', superAdmin, async (req, res) => {
  const reason = req.body?.reason;
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  event.status = 'rejected';
  await event.save();
  if (reason) console.log(`Event ${event.id} rejected. Reason: ${reason}`);
  res.json({ message: 'Event rejected' });
});

// ==================== USER MANAGEMENT (Super Admin) ====================
router.get('/users', superAdmin, async (_req, res) => {
  try {
    const users = await User.findAll({
      where: { role: { [Op.in]: ['super_admin', 'admin'] } },
      attributes: ['id', 'name', 'email', 'role', 'balance', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users.map((u) => ({ ...u.toJSON(), _id: u.id, createdAt: u.createdAt })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users', superAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body as { name: string; email: string; password: string; role?: string };
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email sudah terdaftar' });

    const allowedRoles = ['admin', 'super_admin'];
    const user = await User.create({
      name,
      email,
      password,
      role: allowedRoles.includes(role || '') ? (role as 'admin' | 'super_admin') : 'admin',
    });
    res.status(201).json({ _id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id', superAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, password, role } = req.body as { name?: string; email?: string; password?: string; role?: string };
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email sudah terdaftar' });
      user.email = email;
    }
    if (name) user.name = name;
    if (role && ['admin', 'super_admin'].includes(role)) user.role = role as 'admin' | 'super_admin';
    if (password) user.password = password;

    await user.save();
    res.json({ _id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/users/:id', superAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.id === (req.user as User).id) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun sendiri' });
    }
    await user.destroy();
    res.json({ message: 'Admin deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PHOTOGRAPHERS (Super Admin) ====================
router.get('/photographers', superAdmin, async (_req, res) => {
  try {
    const photographers = await Photographer.findAll({ order: [['order', 'ASC']] });
    res.json(
      photographers.map((p) => ({
        ...p.toJSON(),
        _id: p.id,
        photoUrl: p.photoUrl,
        gradientFrom: p.gradient_from,
        gradientTo: p.gradient_to,
      })),
    );
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/photographers', superAdmin, uploadPhotographer.single('photo'), async (req, res) => {
  try {
    const { name, team, category, gradient_from, gradientFrom, gradient_to, gradientTo, order } = req.body as Record<string, string>;
    const photographer = await Photographer.create({
      name,
      team: team || null,
      category: category || null,
      gradient_from: gradient_from || gradientFrom || '#667eea',
      gradient_to: gradient_to || gradientTo || '#764ba2',
      order: Number(order) || 0,
      photo: req.file?.filename || null,
    });
    res.status(201).json({ ...photographer.toJSON(), _id: photographer.id, photoUrl: photographer.photoUrl });
  } catch (error) {
    console.error('Create photographer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/photographers/:id', superAdmin, uploadPhotographer.single('photo'), async (req, res) => {
  try {
    const photographer = await Photographer.findByPk(req.params.id);
    if (!photographer) return res.status(404).json({ message: 'Photographer not found' });

    const { name, team, category, gradient_from, gradientFrom, gradient_to, gradientTo, order } = req.body as Record<string, string>;
    if (name) photographer.name = name;
    if (team !== undefined) photographer.team = team;
    if (category !== undefined) photographer.category = category;
    if (gradient_from || gradientFrom) photographer.gradient_from = gradient_from || gradientFrom;
    if (gradient_to || gradientTo) photographer.gradient_to = gradient_to || gradientTo;
    if (order !== undefined) photographer.order = Number(order);
    if (req.file) photographer.photo = req.file.filename;

    await photographer.save();
    res.json({ ...photographer.toJSON(), _id: photographer.id, photoUrl: photographer.photoUrl });
  } catch (error) {
    console.error('Update photographer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/photographers/:id', superAdmin, async (req, res) => {
  try {
    await Photographer.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Photographer deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SPONSORS (Super Admin) ====================
router.get('/sponsors', superAdmin, async (_req, res) => {
  try {
    const sponsors = await Sponsor.findAll({ order: [['order', 'ASC'], ['createdAt', 'DESC']] });
    res.json(sponsors.map((s) => ({ ...s.toJSON(), _id: s.id, logoUrl: s.logoUrl })));
  } catch (error) {
    console.error('Sponsors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/sponsors', superAdmin, uploadSponsor.single('logo'), async (req, res) => {
  try {
    const { name, category, order } = req.body as Record<string, string>;
    const sponsor = await Sponsor.create({
      name,
      category: category || null,
      logo: req.file?.filename || null,
      order: Number(order) || 0,
    });
    res.status(201).json({ ...sponsor.toJSON(), _id: sponsor.id, logoUrl: sponsor.logoUrl });
  } catch (error) {
    console.error('Create sponsor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/sponsors/:id', superAdmin, uploadSponsor.single('logo'), async (req, res) => {
  try {
    const sponsor = await Sponsor.findByPk(req.params.id);
    if (!sponsor) return res.status(404).json({ message: 'Sponsor not found' });

    const { name, category, order } = req.body as Record<string, string>;
    sponsor.name = name || sponsor.name;
    sponsor.category = category !== undefined ? category : sponsor.category;
    sponsor.order = order !== undefined ? Number(order) : sponsor.order;
    if (req.file) sponsor.logo = req.file.filename;

    await sponsor.save();
    res.json({ ...sponsor.toJSON(), _id: sponsor.id, logoUrl: sponsor.logoUrl });
  } catch (error) {
    console.error('Update sponsor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/sponsors/:id', superAdmin, async (req, res) => {
  try {
    const sponsor = await Sponsor.findByPk(req.params.id);
    if (!sponsor) return res.status(404).json({ message: 'Sponsor not found' });

    if (sponsor.logo) {
      const logoPath = path.join(uploadsDir(), 'sponsors', sponsor.logo);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    }

    await sponsor.destroy();
    res.json({ message: 'Sponsor deleted' });
  } catch (error) {
    console.error('Delete sponsor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SETTINGS (Super Admin) ====================
router.get('/settings', superAdmin, async (_req, res) => {
  try {
    res.json(await SiteSetting.getBrand());
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/settings', superAdmin, uploadSettings.single('logo'), async (req, res) => {
  try {
    const { site_name, tagline, contact_email, contact_phone } = req.body as Record<string, string>;
    if (site_name) await SiteSetting.setValue('site_name', site_name);
    if (tagline !== undefined) await SiteSetting.setValue('tagline', tagline);
    if (contact_email !== undefined) await SiteSetting.setValue('contact_email', contact_email);
    if (contact_phone !== undefined) await SiteSetting.setValue('contact_phone', contact_phone);
    if (req.file) await SiteSetting.setValue('site_logo', req.file.filename);
    res.json(await SiteSetting.getBrand());
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/settings/logo', superAdmin, async (_req, res) => {
  await SiteSetting.setValue('site_logo', null);
  res.json({ message: 'Logo removed' });
});

// ==================== BALANCE & WITHDRAWALS ====================
router.get('/balance', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const withdrawals = await WithdrawalRequest.findAll({
      where: { user_id: user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({
      balance: Number(user.balance),
      withdrawals: withdrawals.map((w) => ({
        ...w.toJSON(),
        _id: w.id,
        amount: Number(w.amount),
        bankName: w.bank_name,
        accountNumber: w.account_number,
        accountName: w.account_name,
      })),
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/withdrawals', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as User;
    const { amount, bankName, accountNumber, accountName } = req.body as {
      amount: number;
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
    const balance = Number(user.balance);
    if (Number(amount) > balance) return res.status(400).json({ message: 'Saldo tidak mencukupi' });
    if (Number(amount) < 50000) return res.status(400).json({ message: 'Minimal penarikan Rp 50.000' });

    const withdrawal = await WithdrawalRequest.create({
      user_id: user.id,
      amount: Number(amount),
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      status: 'pending',
    });
    res.status(201).json({ ...withdrawal.toJSON(), _id: withdrawal.id });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/withdrawals', superAdmin, async (_req, res) => {
  try {
    const withdrawals = await WithdrawalRequest.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(
      withdrawals.map((w) => ({
        ...w.toJSON(),
        _id: w.id,
        amount: Number(w.amount),
        bankName: w.bank_name,
        accountNumber: w.account_number,
        accountName: w.account_name,
        userId: (w as unknown as { user?: User }).user,
      })),
    );
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/withdrawals/:id/approve', superAdmin, async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const withdrawal = await WithdrawalRequest.findByPk(req.params.id, { transaction: t });
    if (!withdrawal) {
      await t.rollback();
      return res.status(404).json({ message: 'Request not found' });
    }
    if (!withdrawal.isPending()) {
      await t.rollback();
      return res.status(400).json({ message: 'Request already processed' });
    }

    await User.decrement('balance', {
      by: Number(withdrawal.amount),
      where: { id: withdrawal.user_id },
      transaction: t,
    });

    withdrawal.status = 'approved';
    withdrawal.processed_by = (req.user as User).id;
    withdrawal.processed_at = new Date();
    withdrawal.admin_notes = (req.body as { notes?: string }).notes || null;
    await withdrawal.save({ transaction: t });

    await t.commit();
    res.json({ message: 'Withdrawal approved' });
  } catch {
    await t.rollback();
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/withdrawals/:id/reject', superAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const withdrawal = await WithdrawalRequest.findByPk(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Request not found' });
    if (!withdrawal.isPending()) return res.status(400).json({ message: 'Request already processed' });

    withdrawal.status = 'rejected';
    withdrawal.processed_by = (req.user as User).id;
    withdrawal.processed_at = new Date();
    withdrawal.admin_notes = (req.body as { notes?: string }).notes || null;
    await withdrawal.save();

    res.json({ message: 'Withdrawal rejected' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== UPCOMING EVENTS CALENDAR ====================
router.get('/upcoming-events', async (_req, res) => {
  try {
    const now = new Date();
    const events = await Event.findAll({
      where: { start_time: { [Op.ne]: null } },
      order: [['start_time', 'DESC']],
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
    });

    res.json(
      events.map((e) => {
        const isExpired = new Date(e.start_time as Date) <= now;
        return {
          id: e.id,
          title: e.name,
          name: e.name,
          category: e.category,
          categoryLabel: CATEGORY_LABELS[e.category as EventCategory] || e.category,
          location: e.location,
          start_time: e.start_time,
          startTime: e.start_time,
          external_link: e.external_link,
          is_published: e.is_published,
          isPublished: e.is_published,
          status: e.status,
          eventStatus: isExpired ? 'expired' : 'upcoming',
          isExpired,
          image: e.image,
          imageUrl: e.imageUrl || (e.image ? `/uploads/events/${e.image}` : null),
          creator: (e as unknown as { creator?: User }).creator,
          createdAt: e.createdAt,
        };
      }),
    );
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/upcoming-events/:id', async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json({
    id: event.id,
    title: event.name,
    name: event.name,
    category: event.category,
    location: event.location,
    date: event.date,
    start_time: event.start_time,
    external_link: event.external_link,
    is_published: event.is_published,
    status: event.status,
    image: event.image,
    imageUrl: event.imageUrl,
  });
});

router.post('/upcoming-events', uploadEvent.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, location, start_time, external_link, is_published } = req.body as Record<string, string>;
    if (!title || !start_time) {
      return res.status(400).json({ message: 'Title and start time are required' });
    }

    const event = await Event.create({
      name: title,
      category: (category || 'road_race') as EventCategory,
      location: location || '',
      date: new Date(start_time).toISOString().split('T')[0],
      start_time: new Date(start_time),
      external_link: external_link || null,
      is_published: is_published === 'true' || is_published === 'true',
      status: 'approved',
      created_by: (req.user as User).id,
      image: req.file?.filename || null,
    });

    res.status(201).json({ message: 'Event created successfully', event: { ...event.toJSON(), imageUrl: event.imageUrl } });
  } catch (error) {
    console.error('Create upcoming event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/upcoming-events/:id', uploadEvent.single('image'), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const { title, category, location, start_time, external_link, is_published } = req.body as Record<string, string>;
    if (title) event.name = title;
    if (category) event.category = category as EventCategory;
    if (location !== undefined) event.location = location;
    if (start_time) {
      event.start_time = new Date(start_time);
      event.date = new Date(start_time).toISOString().split('T')[0];
    }
    if (external_link !== undefined) event.external_link = external_link;
    if (is_published !== undefined) event.is_published = is_published === 'true';

    if (req.file) {
      if (event.image) {
        const oldPath = path.join(uploadsDir(), 'events', event.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      event.image = req.file.filename;
    }

    await event.save();
    res.json({ message: 'Event updated successfully', event: { ...event.toJSON(), imageUrl: event.imageUrl } });
  } catch (error) {
    console.error('Update upcoming event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/upcoming-events/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.image) {
      const imagePath = path.join(uploadsDir(), 'events', event.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    await event.destroy();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete upcoming event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/upcoming-events/:id/toggle-publish', async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  event.is_published = !event.is_published;
  await event.save();
  res.json({
    message: event.is_published ? 'Event published' : 'Event unpublished',
    is_published: event.is_published,
  });
});

export default router;
