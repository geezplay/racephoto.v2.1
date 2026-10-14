import type { DiscountType } from '@racephoto/shared';

export interface DiscountRules {
  discount_type: DiscountType;
  discount_value: number;
  max_photos: number | null;
  event_ids: number[] | null;
}

export interface DiscountLineItem {
  price: number;
  eventId?: number | null;
}

export interface DiscountComputation {
  eligibleItems: DiscountLineItem[];
  eligibleSubtotal: number;
  discountAmount: number;
}

/**
 * Single source of truth for applying a discount code. Used by both the public
 * /discounts/validate endpoint and order creation so they can never disagree.
 */
export function computeDiscount(
  discount: DiscountRules,
  items: DiscountLineItem[],
  subtotal: number,
): DiscountComputation {
  let eligible = [...items];

  if (discount.event_ids && discount.event_ids.length > 0) {
    eligible = eligible.filter(
      (item) => item.eventId != null && discount.event_ids!.includes(Number(item.eventId)),
    );
  }

  if (discount.max_photos && eligible.length > discount.max_photos) {
    eligible = eligible.slice(0, discount.max_photos);
  }

  const eligibleSubtotal = eligible.reduce((sum, item) => sum + Number(item.price || 0), 0);

  let discountAmount =
    discount.discount_type === 'percent'
      ? Math.floor((eligibleSubtotal * discount.discount_value) / 100)
      : Math.min(discount.discount_value, eligibleSubtotal);

  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  return { eligibleItems: eligible, eligibleSubtotal, discountAmount };
}

export interface DiscountValidity {
  is_active: boolean;
  valid_until: Date | null;
  usage_limit: number | null;
  used_count: number;
}

/** Shared active/expiry/usage-limit gate for a discount code. */
export function checkDiscountValidity(
  discount: DiscountValidity,
  now: Date = new Date(),
): { ok: true } | { ok: false; message: string } {
  if (!discount.is_active) {
    return { ok: false, message: 'Kode diskon sudah tidak aktif' };
  }
  if (discount.valid_until && new Date(discount.valid_until) < now) {
    return { ok: false, message: 'Kode diskon sudah kadaluarsa' };
  }
  if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
    return { ok: false, message: 'Kode diskon sudah mencapai batas penggunaan' };
  }
  return { ok: true };
}

/**
 * Normalize a client-supplied date so an end date is inclusive of the whole day
 * (23:59:59.999) instead of expiring at midnight UTC.
 */
export function endOfDay(value: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  if (!dateOnly) return new Date(value);
  return new Date(`${value.trim()}T23:59:59.999`);
}
