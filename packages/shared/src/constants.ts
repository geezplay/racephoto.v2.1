export const ROLES = ['super_admin', 'admin', 'buyer'] as const;
export type Role = (typeof ROLES)[number];

export const PUBLIC_REGISTER_ROLE: Role = 'buyer';

export const ORDER_STATUSES = ['pending', 'success', 'failed'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const EVENT_STATUSES = ['approved', 'pending', 'rejected'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const WITHDRAWAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const EVENT_CATEGORIES = ['drag', 'drift', 'rally', 'touring', 'moto', 'road_race'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  drag: 'Drag Race',
  drift: 'Drift',
  rally: 'Rally',
  touring: 'Touring',
  moto: 'Moto GP',
  road_race: 'Road Race',
};

export const DISCOUNT_TYPES = ['percent', 'flat'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PAYMENT_METHODS = [
  'qris',
  'gopay',
  'bni_va',
  'bri_va',
  'permata_va',
  'cimb_va',
  'mandiri_bill',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

interface AdminFeeRule {
  type: 'percent' | 'flat';
  value: number;
  label: string;
}

export const ADMIN_FEES: Record<PaymentMethod, AdminFeeRule> = {
  qris: { type: 'percent', value: 0.7, label: 'QRIS (0.7%)' },
  gopay: { type: 'percent', value: 2, label: 'GoPay (2%)' },
  bni_va: { type: 'flat', value: 4000, label: 'BNI VA (Rp 4.000)' },
  bri_va: { type: 'flat', value: 4000, label: 'BRI VA (Rp 4.000)' },
  permata_va: { type: 'flat', value: 4000, label: 'Permata VA (Rp 4.000)' },
  cimb_va: { type: 'flat', value: 4000, label: 'CIMB VA (Rp 4.000)' },
  mandiri_bill: { type: 'flat', value: 4000, label: 'Mandiri (Rp 4.000)' },
};

export function calculateAdminFee(method: PaymentMethod, baseAmount: number): number {
  const rule = ADMIN_FEES[method];
  if (!rule) return 0;
  return rule.type === 'percent' ? Math.ceil(baseAmount * (rule.value / 100)) : rule.value;
}

export const MIN_WITHDRAWAL_AMOUNT = 50000;
