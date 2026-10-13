import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../services/api';
import { pageStyle, cardStyle, headerTitleStyle } from '../auth/authStyles';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface OrderSummary {
  id: number;
  email: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function AccountOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data.orders as OrderSummary[]))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ ...pageStyle, alignItems: 'flex-start', paddingTop: '3rem' }}>
      <div style={{ width: '100%', maxWidth: '40rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={headerTitleStyle}>Riwayat Pesanan</h1>
          <Link to="/account" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}><ArrowLeft size={14} /> Akun</Link>
        </div>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Memuat...</p>
        ) : orders.length === 0 ? (
          <div style={cardStyle}>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Belum ada pesanan.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((o) => (
              <div key={o.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>Order #{o.id}</p>
                    <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                      {new Date(o.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, color: '#39FF14', fontWeight: 700 }}>Rp {Number(o.totalPrice).toLocaleString('id-ID')}</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: o.status === 'success' ? '#39FF14' : '#fbbf24', textTransform: 'uppercase' }}>
                      {o.status}
                    </p>
                  </div>
                </div>
                <Link to={`/success?order_id=${o.id}`} style={{ color: '#39FF14', fontSize: '0.85rem', display: 'inline-block', marginTop: '1rem' }}>
                  Lihat detail <ArrowRight size={14} className="inline" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
