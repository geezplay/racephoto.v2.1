import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { loginSchema, registerSchema, updateProfileSchema, PUBLIC_REGISTER_ROLE } from '@racephoto/shared';
import { User } from '../models';
import { AuthRequest, generateToken, protect } from '../middleware/auth';
import { validate } from '../utils/validate';

const router = Router();

const publicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  balance: user.balance,
});

// @route POST /auth/register  (public registration -> buyer only)
router.post('/register', async (req, res) => {
  const data = validate(registerSchema, req.body, res);
  if (!data) return;

  try {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Role is never taken from the request body.
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: PUBLIC_REGISTER_ROLE,
      auth_provider: 'local',
    });

    const token = generateToken(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /auth/login  (buyers and admins)
router.post('/login', async (req, res) => {
  const data = validate(loginSchema, req.body, res);
  if (!data) return;

  try {
    const user = await User.findOne({ where: { email: data.email } });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const isMatch = await user.matchPassword(data.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const token = generateToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  res.json(publicUser(req.user as User));
});

router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
  const data = validate(updateProfileSchema, req.body, res);
  if (!data) return;

  const user = req.user as User;
  if (data.name) user.name = data.name;
  if (data.password) user.password = data.password;
  await user.save();

  res.json(publicUser(user));
});

// ---------- Google OAuth 2.0 (server-side redirect flow) ----------

function getOAuthClient(): OAuth2Client | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return new OAuth2Client({ clientId, clientSecret, redirectUri });
}

function frontendRedirect(params: Record<string, string>): string {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base}/auth/callback?${new URLSearchParams(params).toString()}`;
}

// @route GET /auth/google
router.get('/google', (req, res) => {
  const client = getOAuthClient();
  if (!client) {
    return res.status(503).json({ message: 'Login Google belum dikonfigurasi' });
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const state = jwt.sign({ nonce }, process.env.JWT_SECRET as string, { expiresIn: '10m' });

  const url = client.generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });
  res.redirect(url);
});

// @route GET /auth/google/callback
router.get('/google/callback', async (req, res) => {
  const client = getOAuthClient();
  const code = typeof req.query.code === 'string' ? req.query.code : null;
  const state = typeof req.query.state === 'string' ? req.query.state : null;

  if (!client) {
    return res.redirect(frontendRedirect({ error: 'google_not_configured' }));
  }
  if (!code || !state) {
    return res.redirect(frontendRedirect({ error: 'google_cancelled' }));
  }

  // Verify state (CSRF protection).
  try {
    jwt.verify(state, process.env.JWT_SECRET as string);
  } catch {
    return res.redirect(frontendRedirect({ error: 'invalid_state' }));
  }

  try {
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      return res.redirect(frontendRedirect({ error: 'no_id_token' }));
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID as string,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return res.redirect(frontendRedirect({ error: 'invalid_google_account' }));
    }

    const email = payload.email;
    const googleId = payload.sub;

    let user = await User.findOne({ where: { google_id: googleId } });

    if (!user) {
      const byEmail = await User.findOne({ where: { email } });
      if (byEmail) {
        // Never auto-link an existing local account by email.
        return res.redirect(frontendRedirect({ error: 'email_conflict' }));
      }
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        password: null,
        google_id: googleId,
        auth_provider: 'google',
        role: PUBLIC_REGISTER_ROLE,
      });
    }

    const token = generateToken(user.id);
    return res.redirect(frontendRedirect({ token }));
  } catch (error) {
    console.error('Google callback error:', error);
    return res.redirect(frontendRedirect({ error: 'google_auth_failed' }));
  }
});

export default router;
