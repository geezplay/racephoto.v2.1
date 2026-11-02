import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/api';
import { pageStyle, cardStyle, inputStyle, buttonStyle, headerTitleStyle } from '../auth/authStyles';
import { ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function Account() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const payload: { name?: string; password?: string } = {};
      if (name && name !== user?.name) payload.name = name;
      if (password || confirmPassword) {
        if (password.length < 6) {
          setError('Password baru minimal 6 karakter.');
          setSaving(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Konfirmasi password tidak cocok.');
          setSaving(false);
          return;
        }
        payload.password = password;
      }
      const res = await updateProfile(payload);
      const token = localStorage.getItem('token') as string;
      login(token, res.data);
      setPassword('');
      setConfirmPassword('');
      setMessage('Profil berhasil diperbarui.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ ...pageStyle, alignItems: 'flex-start', paddingTop: '3rem' }}>
      <div style={{ width: '100%', maxWidth: '32rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={headerTitleStyle}>Akun Saya</h1>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer' }}
          >
            Keluar
          </button>
        </div>

        <div style={cardStyle}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0 }}>Email</p>
          <p style={{ marginTop: '0.25rem', marginBottom: '1.25rem' }}>{user.email}</p>

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0 }}>Saldo</p>
          <p style={{ marginTop: '0.25rem', marginBottom: '1.5rem', color: '#39FF14', fontWeight: 700 }}>
            Rp {user.balance.toLocaleString('id-ID')}
          </p>

          {message && <p style={{ color: '#39FF14', fontSize: '0.875rem' }}>{message}</p>}
          {error && <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" placeholder="Nama" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} style={inputStyle} />
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password baru (opsional)"
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                style={{ ...inputStyle, paddingRight: '3rem' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Verifikasi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                style={{ ...inputStyle, paddingRight: '3rem' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" disabled={saving} style={{ ...buttonStyle, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/account/orders" style={{ color: '#39FF14' }}>
            Lihat riwayat pesanan <ArrowRight size={14} className="inline" />
          </Link>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}><ArrowLeft size={14} /> Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  );
}
