// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act, cleanup, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, type AuthUser } from './AuthContext';
import { getMe } from '../services/api';

vi.mock('../services/api', () => ({
  getMe: vi.fn(),
}));

let auth: ReturnType<typeof useAuth>;

function Capture() {
  auth = useAuth();
  return null;
}

const renderAuth = () => render(
  <AuthProvider>
    <Capture />
  </AuthProvider>
);

const adminUser: AuthUser = { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin', balance: 0 };
const superUser: AuthUser = { id: 2, name: 'Super', email: 'super@example.com', role: 'super_admin', balance: 0 };

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    vi.restoreAllMocks();
  });

  it('finishes loading with no user when unauthenticated', async () => {
    renderAuth();
    await waitFor(() => expect(auth.loading).toBe(false));
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
  });

  it('logs in and persists token/user', () => {
    renderAuth();
    act(() => {
      auth.login('token-123', adminUser);
    });
    expect(auth.user?.email).toBe('admin@example.com');
    expect(auth.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('token-123');
    expect(JSON.parse(localStorage.getItem('user') || '{}').id).toBe(1);
  });

  it('reports roles correctly', () => {
    renderAuth();
    act(() => {
      auth.login('token-123', superUser);
    });
    expect(auth.isSuperAdmin()).toBe(true);
    expect(auth.isAdmin()).toBe(true);
    expect(auth.isBuyer()).toBe(false);
  });

  it('logs out and clears persisted state', () => {
    renderAuth();
    act(() => {
      auth.login('token-123', adminUser);
    });
    act(() => {
      auth.logout();
    });
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('restores session from storage and refreshes via getMe', async () => {
    localStorage.setItem('token', 'stored-token');
    localStorage.setItem('user', JSON.stringify(adminUser));
    const fresh = { ...adminUser, name: 'Fresh Admin' };
    vi.mocked(getMe).mockResolvedValue({ data: fresh } as any);

    renderAuth();
    await waitFor(() => expect(auth.loading).toBe(false));
    expect(auth.user?.name).toBe('Fresh Admin');
  });
});
