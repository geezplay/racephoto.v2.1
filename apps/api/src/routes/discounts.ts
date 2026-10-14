import { Router } from 'express';
import { discountSchema, validateDiscountSchema } from '@racephoto/shared';
import { DiscountCode } from '../models';
import { protect, superAdmin } from '../middleware/auth';
import { validate } from '../utils/validate';
import { computeDiscount, checkDiscountValidity, endOfDay } from '../utils/discount';

const router = Router();

// POST /discounts/validate  (public)
router.post('/validate', async (req, res) => {
  const data = validate(validateDiscountSchema, req.body, res);
  if (!data) return;

  try {
    const discount = await DiscountCode.findOne({ where: { code: data.code.toUpperCase().trim() } });
    if (!discount) return res.status(404).json({ message: 'Kode diskon tidak ditemukan' });

    const validity = checkDiscountValidity(discount);
    if (!validity.ok) return res.status(400).json({ message: validity.message });

    const { eligibleItems, discountAmount } = computeDiscount(
      discount,
      data.items,
      data.subtotal,
    );

    if (discount.event_ids && discount.event_ids.length > 0 && eligibleItems.length === 0) {
      return res.status(400).json({ message: 'Kode diskon tidak berlaku untuk event di keranjang Anda' });
    }

    res.json({
      valid: true,
      code: discount.code,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      discount_amount: discountAmount,
      max_photos: discount.max_photos,
      eligible_photo_count: eligibleItems.length,
      event_ids: discount.event_ids,
      label: discount.discount_type === 'percent' ? `${discount.discount_value}%` : `Rp ${discount.discount_value.toLocaleString()}`,
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /discounts  (super admin)
router.get('/', protect, superAdmin, async (_req, res) => {
  try {
    const discounts = await DiscountCode.findAll({ order: [['createdAt', 'DESC']] });
    res.json(discounts);
  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /discounts  (super admin)
router.post('/', protect, superAdmin, async (req, res) => {
  const data = validate(discountSchema, req.body, res);
  if (!data) return;

  try {
    const code = data.code.toUpperCase().trim();
    const existing = await DiscountCode.findOne({ where: { code } });
    if (existing) return res.status(400).json({ message: 'Kode diskon sudah ada' });

    const discount = await DiscountCode.create({
      code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      max_photos: data.max_photos ?? null,
      event_ids: data.event_ids && data.event_ids.length > 0 ? data.event_ids.map(Number) : null,
      is_active: data.is_active !== false,
      usage_limit: data.usage_limit ?? null,
      valid_until: data.valid_until ? endOfDay(data.valid_until) : null,
    });
    res.status(201).json(discount);
  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /discounts/:id  (super admin)
router.put('/:id', protect, superAdmin, async (req, res) => {
  try {
    const discount = await DiscountCode.findByPk(req.params.id);
    if (!discount) return res.status(404).json({ message: 'Discount not found' });

    const data = validate(discountSchema.partial(), req.body, res);
    if (!data) return;

    if (data.code) discount.code = data.code.toUpperCase().trim();
    if (data.discount_type) discount.discount_type = data.discount_type;
    if (data.discount_value !== undefined) discount.discount_value = data.discount_value;
    if (data.max_photos !== undefined) discount.max_photos = data.max_photos ?? null;
    if (data.event_ids !== undefined) discount.event_ids = data.event_ids && data.event_ids.length > 0 ? data.event_ids.map(Number) : null;
    if (data.is_active !== undefined) discount.is_active = data.is_active;
    if (data.usage_limit !== undefined) discount.usage_limit = data.usage_limit ?? null;
    if (data.valid_until !== undefined) discount.valid_until = data.valid_until ? endOfDay(data.valid_until) : null;

    await discount.save();
    res.json(discount);
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /discounts/:id  (super admin)
router.delete('/:id', protect, superAdmin, async (req, res) => {
  try {
    const discount = await DiscountCode.findByPk(req.params.id);
    if (!discount) return res.status(404).json({ message: 'Discount not found' });
    await discount.destroy();
    res.json({ message: 'Discount deleted' });
  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
