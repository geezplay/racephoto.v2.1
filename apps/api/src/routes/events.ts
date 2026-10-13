import { Router } from 'express';
import { Op } from 'sequelize';
import { CATEGORY_LABELS, EventCategory } from '@racephoto/shared';
import { Event, EventClass, Photo, Sponsor, Photographer, SiteSetting } from '../models';

const router = Router();

// GET /events/upcoming
router.get('/upcoming', async (_req, res) => {
  try {
    const now = new Date();
    const events = await Event.findAll({
      where: {
        start_time: { [Op.gt]: now },
        is_published: true,
        status: 'approved',
      },
      order: [['start_time', 'ASC']],
      limit: 6,
    });

    const upcomingEvents = events.map((e) => ({
      id: e.id,
      _id: e.id,
      title: e.name,
      name: e.name,
      category: e.category,
      categoryLabel: CATEGORY_LABELS[e.category as EventCategory] || e.category,
      location: e.location,
      start_time: e.start_time,
      startTime: e.start_time,
      external_link: e.external_link,
      externalLink: e.external_link,
      image: e.image,
      imageUrl: e.imageUrl || (e.image ? `/uploads/events/${e.image}` : null),
      bannerImage: e.imageUrl || (e.image ? `/uploads/events/${e.image}` : null),
    }));

    res.json({ success: true, events: upcomingEvents, count: upcomingEvents.length, serverTime: now.toISOString() });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /events
router.get('/', async (_req, res) => {
  try {
    const events = await Event.findAll({
      where: { status: 'approved' },
      include: [{ model: EventClass, as: 'classes' }],
      order: [['date', 'DESC']],
    });

    const sponsorsList = await Sponsor.findAll({ order: [['order', 'ASC']] });
    const photographers = await Photographer.findAll({
      where: { is_active: true },
      order: [['order', 'ASC']],
    });
    const brand = await SiteSetting.getBrand();

    const baseUrl = process.env.BACKEND_URL || '';

    const eventsWithUrl = events.map((e) => ({
      ...e.toJSON(),
      _id: e.id,
      imageUrl: e.imageUrl || (e.image ? `${baseUrl}/uploads/events/${e.image}` : null),
    }));

    const sponsors: Record<string, unknown[]> = {};
    for (const s of sponsorsList) {
      const category = s.category || 'other';
      if (!sponsors[category]) sponsors[category] = [];
      sponsors[category].push({
        ...s.toJSON(),
        _id: s.id,
        logo_url: s.logoUrl || (s.logo ? `${baseUrl}/uploads/sponsors/${s.logo}` : null),
        logoUrl: s.logoUrl || (s.logo ? `${baseUrl}/uploads/sponsors/${s.logo}` : null),
      });
    }

    const photographersWithUrl = photographers.map((p) => ({
      ...p.toJSON(),
      _id: p.id,
      photoUrl: p.photoUrl || (p.photo ? `${baseUrl}/uploads/photographers/${p.photo}` : null),
      photo: p.photoUrl || (p.photo ? `${baseUrl}/uploads/photographers/${p.photo}` : null),
      gradient_from: p.gradient_from,
      gradient_to: p.gradient_to,
      gradientFrom: p.gradient_from,
      gradientTo: p.gradient_to,
    }));

    res.json({ events: eventsWithUrl, sponsors, photographers: photographersWithUrl, brand });
  } catch (error) {
    console.error('GET /events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: EventClass, as: 'classes' }],
    });

    if (!event || event.status !== 'approved') {
      return res.status(404).json({ message: 'Event not found' });
    }

    const photos = await Photo.findAll({
      where: { event_id: event.id },
      attributes: ['class'],
      group: ['class'],
    });
    const photoClasses = photos.map((p) => p.class);

    res.json({
      event: {
        ...event.toJSON(),
        _id: event.id,
        imageUrl: event.imageUrl || (event.image ? `/uploads/events/${event.image}` : null),
      },
      photoClasses,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
