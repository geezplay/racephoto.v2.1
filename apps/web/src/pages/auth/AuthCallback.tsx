import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../services/api';
import { pageStyle, cardStyle, headerTitleStyle } from './authStyles';
import { ArrowLeft } from 'lucide-react';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    const err = params.get('error');

    if (token) {
      localStorage.setItem('token', token);
      getMe()
        .then((res) => {
          login(token, res.data);
          navigate(res.data.role === 'buyer' ? '/account' : '/admin', { replace: true });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setError('Gagal memverifikasi sesi Google. Silakan coba lagi.');
        });
    } else {
      const messages: Record<string, string> = {
        google_not_configured: 'Login Google belum dikonfigurasi di server.',
        google_cancelled: 'Login Google dibatalkan.',
        invalid_state: 'Sesi login tidak valid. Coba lagi.',
        email_conflict: 'Email ini sudah terdaftar dengan metode login lain.',
        invalid_google_account: 'Akun Google tidak valid.',
        google_auth_failed: 'Autentikasi Google gagal.',
      };
      setError((err && messages[err]) || 'Login Google gagal.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: '28rem', textAlign: 'center' }}>
        <h2 style={{ ...headerTitleStyle, marginBottom: '1rem' }}>Memproses Login</h2>
        {error ? (
          <>
            <p style={{ color: '#f87171', fontSize: '0.9rem' }}>{error}</p>
            <Link to="/login" style={{ color: '#39FF14', display: 'inline-block', marginTop: '1.5rem' }}>
              <ArrowLeft size={14} /> Kembali ke halaman login
            </Link>
          </>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Mohon tunggu sebentar...</p>
        )}
      </div>
    </div>
  );
}
