import { z } from 'zod';
import {
  DISCOUNT_TYPES,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from './constants';

export const idParamSchema = z.coerce.number().int().positive();

export const loginSchema = z.object({
  email: z.string().trim().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().trim().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').max(100),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  password: z.string().min(6).max(100).optional(),
});

export const orderItemInputSchema = z.object({
  photoId: z.coerce.number().int().positive(),
  variant: z.coerce.number().int().positive().default(1),
});

export const createOrderSchema = z.object({
  email: z.string().trim().email('Email tidak valid'),
  whatsapp: z.string().trim().min(9, 'Nomor WhatsApp tidak valid').max(20),
  items: z.array(orderItemInputSchema).min(1, 'Keranjang kosong'),
  discountCode: z.string().trim().min(1).max(50).optional().nullable(),
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const eventSchema = z.object({
  name: z.string().trim().min(1, 'Nama event wajib diisi').max(255),
  date: z.string().trim().max(255).optional().nullable(),
  location: z.string().trim().min(1, 'Lokasi wajib diisi').max(255),
  category: z.enum(EVENT_CATEGORIES).default('road_race'),
  external_link: z.string().trim().max(500).optional().nullable(),
  is_published: z.coerce.boolean().optional(),
  start_time: z.string().trim().optional().nullable(),
  status: z.enum(EVENT_STATUSES).optional(),
});

export const photoSchema = z.object({
  event_id: z.coerce.number().int().positive(),
  class: z.string().trim().min(1).max(255),
  start_no: z.string().trim().min(1).max(255),
  price: z.coerce.number().int().nonnegative(),
});

export const discountSchema = z.object({
  code: z.string().trim().min(2).max(50),
  discount_type: z.enum(DISCOUNT_TYPES).default('percent'),
  discount_value: z.coerce.number().int().positive(),
  max_photos: z.coerce.number().int().positive().optional().nullable(),
  event_ids: z.array(z.coerce.number().int().positive()).optional().nullable(),
  is_active: z.coerce.boolean().optional(),
  usage_limit: z.coerce.number().int().positive().optional().nullable(),
  valid_until: z.string().trim().optional().nullable(),
});

export const validateDiscountSchema = z.object({
  code: z.string().trim().min(1),
  subtotal: z.coerce.number().int().nonnegative(),
  items: z.array(
    z.object({
      photoId: z.coerce.number().int().positive(),
      price: z.coerce.number().int().nonnegative(),
      eventId: z.coerce.number().int().positive().optional().nullable(),
    }),
  ),
});

export const withdrawalSchema = z.object({
  amount: z.coerce.number().positive(),
  bank_name: z.string().trim().min(1).max(100),
  account_number: z.string().trim().min(1).max(50),
  account_name: z.string().trim().min(1).max(100),
});

export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
