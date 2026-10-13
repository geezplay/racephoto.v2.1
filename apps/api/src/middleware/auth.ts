import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models';

export interface AuthRequest extends Request {
  user?: User;
}

export const generateToken = (id: number): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign({ id }, secret, { expiresIn });
};

// Verify JWT and attach the user.
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token: string | undefined;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Tidak terautentikasi' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User tidak ditemukan' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Attach the user when a valid token is present, but never reject.
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (req.headers.authorization?.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
      req.user = (await User.findByPk(decoded.id)) ?? undefined;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.isAdmin()) {
    res.status(403).json({ message: 'Akses ditolak, hanya untuk admin' });
    return;
  }
  next();
};

export const superAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.isSuperAdmin()) {
    res.status(403).json({ message: 'Akses ditolak, hanya untuk super admin' });
    return;
  }
  next();
};
