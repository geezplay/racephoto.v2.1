import crypto from 'crypto';

/**
 * Opaque token handed to guest buyers so they can access their own order.
 * Only the hash is persisted.
 */
export const generateGuestToken = (): string => crypto.randomBytes(32).toString('hex');

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');
