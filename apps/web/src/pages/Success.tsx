import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, Hourglass, Check, Download, ArrowLeft } from 'lucide-react';
import { getOrder } from '../services/api';
import api from '../services/api';

// Extract numeric order ID from Midtrans invoice format: RACEPHOTO-{ID}-{timestamp}
function extractOrderId(rawId: any) {
    if (!rawId) return null;
    // If it's already a number, return as-is
    if (/^\d+$/.test(rawId)) return rawId;
    // Try to extract from RACEPHOTO-{ID}-{timestamp}
    const match = rawId.match(/^RACEPHOTO-(\d+)-/);
    if (match) return match[1];
    // Fallback: return as-is
    return rawId;
}

export default function Success() {
    const [searchParams] = useSearchParams();
    const rawOrderId = searchParams.get('order_id') || searchParams.get('invoice_number') || localStorage.getItem('pending_order_id');
    const orderId = extractOrderId(rawOrderId);
    const guestToken = orderId ? localStorage.getItem(`racephoto_order_${orderId}`) : null;
    const urlStatus = searchParams.get('status');
    const transactionStatus = searchParams.get('transaction_status'); // Snap sends this too
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const pollRef = useRef<any>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }

            try {
                const res = await getOrder(orderId, guestToken);
                setOrder(res.data);

                // If status is not success yet, poll check-status as webhook fallback
                if (res.data?.status !== 'success') {
                    let attempts = 0;
                    const maxAttempts = 12; // 1 minute max
                    pollRef.current = setInterval(async () => {
                        attempts++;
                        if (attempts > maxAttempts) {
                            clearInterval(pollRef.current);
                            return;
                        }
                        try {
                            // Call check-status which queries Midtrans API and updates order
                            const statusRes = await api.get(`/payment/check-status/${orderId}`, { params: guestToken ? { token: guestToken } : {} });
                            if (statusRes.data?.status === 'success') {
                                // Refresh order data
                                const updatedOrder = await getOrder(orderId, guestToken);
                                setOrder(updatedOrder.data);
                                clearInterval(pollRef.current);
                            }
                        } catch (err: any) {
                            console.error('Status poll error:', err);
                        }
                    }, 5000);
                }
            } catch (error: any) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
        // Clean up pending order ID from localStorage
        if (orderId) {
            localStorage.removeItem('pending_order_id');
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [orderId]);

    const formatPrice = (price: any) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    // Prioritize URL status over database status
    // If URL says success, show success (because DOKU callback confirmed it)
    const isSuccess = urlStatus === 'success' || order?.status === 'success';
    const isPending = !isSuccess && (urlStatus === 'pending' || order?.status === 'pending');

    return (
        <div className="app-wrapper">
            {/* Navbar */}
            <nav className="main-navbar">
                <div className="navbar-inner">
                    <Link to="/" className="logo-link">
                        <div className="logo-icon"><Camera size={22} color="black" /></div>
                        <span className="logo-text">GEEZ<span className="accent">PLAY</span></span>
                    </Link>
                </div>
            </nav>

            {/* Success Content */}
            <div style={{
                paddingTop: '6rem',
                paddingBottom: '4rem',
                maxWidth: '600px',
                margin: '0 auto',
                padding: '6rem 1rem 4rem',
                textAlign: 'center'
            }}>
                <div style={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '32px',
                    padding: '3rem 2rem',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}>
                    {isPending ? (
                        <>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'rgba(245,158,11,0.1)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                fontSize: '2.5rem'
                            }}>
                                <Hourglass size={40} color="#f59e0b" />
                            </div>
                            <h1 style={{
                                fontSize: '1.5rem',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                fontStyle: 'italic',
                                marginBottom: '0.5rem',
                                color: '#f59e0b'
                            }}>
                                Menunggu Pembayaran
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>
                                Silakan selesaikan pembayaran Anda. Foto akan dikirim ke email setelah pembayaran dikonfirmasi.
                            </p>
                        </>
                    ) : (
                        <>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'rgba(57,255,20,0.1)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                fontSize: '2.5rem',
                                color: '#39FF14'
                            }}>
                                <Check size={40} />
                            </div>
                            <h1 style={{
                                fontSize: '1.5rem',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                fontStyle: 'italic',
                                marginBottom: '0.5rem',
                                color: '#39FF14'
                            }}>
                                Pembayaran Berhasil!
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>
                                Terima kasih atas pesanan Anda. Foto sudah dikirim ke email Anda.
                            </p>
                        </>
                    )}

                    {order && (
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '1.5rem',
                            borderRadius: '20px',
                            textAlign: 'left',
                            marginBottom: '2rem'
                        }}>
                            <h4 style={{
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                fontWeight: '900',
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '1rem'
                            }}>
                                Detail Pesanan
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Order ID</span>
                                    <span style={{ fontFamily: 'monospace' }}>{order._id || order.id}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Email</span>
                                    <span>{order.email}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Jumlah Item</span>
                                    <span>{order.items?.length || 0} foto</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Total</span>
                                    <span style={{ color: '#39FF14', fontWeight: '900' }}>
                                        {formatPrice(order.totalPrice || order.total_price)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Status</span>
                                    <span style={{
                                        background: isSuccess ? 'rgba(57,255,20,0.1)' : 'rgba(245,158,11,0.1)',
                                        color: isSuccess ? '#39FF14' : '#f59e0b',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase'
                                    }}>
                                        {isSuccess ? 'SUCCESS' : 'PENDING'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Purchased Photos Section */}
                    {isSuccess && order?.items && order.items.length > 0 && (
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '1.5rem',
                            borderRadius: '20px',
                            textAlign: 'left',
                            marginBottom: '2rem'
                        }}>
                            <h4 style={{
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                fontWeight: '900',
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                            }}>
                                <Camera size={14} /> Foto Pesanan Anda
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {order.items.map((item: any, idx: any) => {
                                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

                                    // Helper to construct full URL
                                    const getFullUrl = (path: any) => {
                                        if (!path) return null;
                                        if (path.startsWith('http')) return path;
                                        return `${API_URL}${path}`;
                                    };

                                    // Priority: recapUrl > mainPhotoUrl > photoUrl
                                    const photoUrl = getFullUrl(item.recapUrl) || getFullUrl(item.mainPhotoUrl) || getFullUrl(item.photoUrl);

                                    return (
                                        <div key={item.id || idx} style={{
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {/* Top row: Thumbnail + Details */}
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.75rem',
                                                alignItems: 'center',
                                                marginBottom: '0.75rem'
                                            }}>
                                                {/* Photo Thumbnail */}
                                                <div style={{
                                                    width: '64px',
                                                    height: '64px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                    background: 'rgba(0,0,0,0.5)'
                                                }}>
                                                    {photoUrl ? (
                                                        <img
                                                            src={photoUrl}
                                                            alt={`Foto ${idx + 1}`}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                            onError={(e) => {
                                                                if (!(e.target as HTMLElement).dataset.fallback) {
                                                                    (e.target as HTMLElement).dataset.fallback = 'true';
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                    ((e.target as HTMLElement).parentNode! as HTMLElement).innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>';
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'rgba(255,255,255,0.3)'
                                                        }}><Camera size={24} /></div>
                                                    )}
                                                </div>

                                                {/* Photo Details */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: '700',
                                                        marginBottom: '0.15rem',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {item.eventName || 'Event'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.7rem',
                                                        color: 'rgba(255,255,255,0.5)'
                                                    }}>
                                                        Start #{item.startNo} • Varian {item.variant}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#39FF14',
                                                        fontWeight: '700',
                                                        marginTop: '0.15rem'
                                                    }}>
                                                        {formatPrice(item.price)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Download Button — full width */}
                                            <a
                                                href={`${API_URL}/api/photos/download-by-order/${orderId}/${idx}${guestToken ? `?token=${encodeURIComponent(guestToken)}` : ''}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    width: '100%',
                                                    padding: '0.65rem 1rem',
                                                    background: '#39FF14',
                                                    color: 'black',
                                                    borderRadius: '10px',
                                                    fontWeight: '800',
                                                    fontSize: '0.75rem',
                                                    textDecoration: 'none',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.03em',
                                                    boxSizing: 'border-box' as const,
                                                    boxShadow: '0 4px 12px rgba(57,255,20,0.2)'
                                                }}
                                            >
                                                <Download size={14} /> Download Foto
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <Link
                        to="/"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#39FF14',
                            color: 'black',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            fontStyle: 'italic',
                            letterSpacing: '-0.02em',
                            textDecoration: 'none',
                            boxShadow: '0 15px 30px rgba(57,255,20,0.3)'
                        }}
                    >
                        <ArrowLeft size={18} /> Kembali ke Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
