import { Response } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validate request data against a zod schema. On failure, sends a 400 response
 * and returns null so the caller can simply `return`.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown, res: Response): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues[0]?.message || 'Data tidak valid';
    res.status(400).json({ message });
    return null;
  }
  return result.data;
}
