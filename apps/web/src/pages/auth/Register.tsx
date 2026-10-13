import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register as registerApi, googleLoginUrl } from '../../services/api';
import { pageStyle, cardStyle, inputStyle, buttonStyle, googleButtonStyle, headerTitleStyle } from './authStyles';
import { Camera } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<any>({ name: '', email: '', password: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerApi(formData.name, formData.email, formData.password);
      login(res.data.token, res.data.user);
      navigate('/account');
    } catch (err: any) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{ background: '#39FF14', padding: '0.5rem', borderRadius: '0.5rem' }}><Camera size={28} /></div>
          <h1 style={headerTitleStyle}>RacePhoto</h1>
        </div>

        <div style={cardStyle}>
          <h2 style={{ ...headerTitleStyle, textAlign: 'center' }}>Daftar</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '2rem' }}>
            Buat akun pembeli untuk melihat riwayat pesanan
          </p>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <input type="text" placeholder="Nama" required minLength={2} value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: (e.target as any).value })} style={inputStyle} />
            <input type="email" placeholder="Email" required value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: (e.target as any).value })} style={inputStyle} />
            <input type="password" placeholder="Password (min. 6 karakter)" required minLength={6} value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: (e.target as any).value })} style={inputStyle} />
            <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Loading...' : 'Daftar'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>ATAU</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <a href={googleLoginUrl()} style={googleButtonStyle}>
            <span style={{ fontWeight: 700 }}>G</span> Daftar dengan Google
          </a>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            Sudah punya akun? <Link to="/login" style={{ color: '#39FF14' }}>Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
