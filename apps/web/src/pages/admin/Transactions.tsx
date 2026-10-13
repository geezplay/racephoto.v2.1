import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getAdminTransactions } from '../../services/api';
import {
    Camera,
    User,
    ShoppingCart,
    CheckCircle,
    Clock,
    XCircle,
    X
} from 'lucide-react';

export default function Transactions() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<any>(null);
    const [filters, setFilters] = useState<any>({ events: [], classes: [] });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Filter states
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterEvent, setFilterEvent] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchTransactions();

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await getAdminTransactions();
            if (res.data.orders) {
                setTransactions(res.data.orders);
                setFilters(res.data.filters || { events: [], classes: [] });
            } else {
                const data = Array.isArray(res.data) ? res.data : [];
                setTransactions(data);
            }
        } catch (error: any) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: any) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price || 0);
    };

    const formatDate = (date: any) => {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e: any) {
            return '-';
        }
    };

    const getStatusStyle = (status: any) => {
        const styles: Record<string, { bg: string; color: string }> = {
            success: { bg: 'rgba(57,255,20,0.1)', color: '#39FF14' },
            pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
            failed: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
            cancelled: { bg: 'rgba(156,163,175,0.1)', color: '#9ca3af' }
        };
        return styles[status] || styles.pending;
    };

    const getStatusLabel = (status: any) => {
        const labels: Record<string, string> = {
            success: 'Sukses',
            pending: 'Pending',
            failed: 'Gagal',
            cancelled: 'Dibatalkan'
        };
        return labels[status] || status;
    };

    const filteredTransactions = transactions
        .filter(tx => {
            if (filterStatus && tx.status !== filterStatus) return false;
            if (filterEvent) {
                const hasEvent = tx.items?.some((item: any) =>
                    (item.snap_event_name && item.snap_event_name.toLowerCase().includes(filterEvent.toLowerCase())) ||
                    (item.photo?.event_name && item.photo.event_name.toLowerCase().includes(filterEvent.toLowerCase()))
                );
                if (!hasEvent) return false;
            }
            if (filterClass) {
                const hasClass = tx.items?.some((item: any) =>
                    (item.snap_photo_class && item.snap_photo_class.toLowerCase().includes(filterClass.toLowerCase())) ||
                    (item.photo?.class && item.photo.class.toLowerCase().includes(filterClass.toLowerCase()))
                );
                if (!hasClass) return false;
            }
            const txDate = new Date(tx.createdAt || tx.created_at);
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (txDate < start) return false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (txDate > end) return false;
            }
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.created_at);
            const dateB = new Date(b.createdAt || b.created_at);
            return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });

    if (loading) {
        return (
            <AdminLayout title="Transaksi">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    const selectStyle = {
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        fontSize: '0.8rem',
        minWidth: '0',
        width: '100%',
        cursor: 'pointer',
        boxSizing: 'border-box' as const
    };

    const hasActiveFilters = filterStatus || filterEvent || filterClass || startDate || endDate;

    // Expanded detail content (shared between table and card views)
    const renderExpandedDetails = (tx: any) => (
        <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginTop: '0.75rem'
        }}>
            <h4 style={{
                fontSize: '0.75rem',
                fontWeight: '900',
                color: '#39FF14',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <Camera size={14} /> Detail Item
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tx.items.map((item: any, idx: any) => (
                    <div key={item.id || idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                                <Camera size={12} />
                                <span>{item.snap_event_name || item.photo?.event_name || 'Event'}</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>- No. {item.snap_photo_start_no || item.photo?.start_no || '-'}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                                Kelas: {item.snap_photo_class || item.photo?.class || '-'} • Varian: {item.variant || 1}
                            </div>
                            {item.photo?.creator_name && (
                                <div style={{
                                    fontSize: '0.65rem',
                                    color: 'rgba(57,255,20,0.7)',
                                    marginTop: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <User size={10} /> Upload: <strong>{item.photo.creator_name}</strong>
                                    {item.photo.creator_email && (
                                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            ({item.photo.creator_email})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{
                            fontWeight: '900',
                            color: '#39FF14',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap'
                        }}>
                            {formatPrice(item.price)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <AdminLayout title="Transaksi" subtitle="Histori pembelian foto">
            {/* Filter Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                        Urutkan
                    </span>
                    <select value={sortOrder} onChange={(e) => setSortOrder((e.target as any).value)} style={selectStyle}>
                        <option value="desc">Terbaru</option>
                        <option value="asc">Terlama</option>
                    </select>
                </div>

                <div>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                        Status
                    </span>
                    <select value={filterStatus} onChange={(e) => setFilterStatus((e.target as any).value)} style={selectStyle}>
                        <option value="">Semua</option>
                        <option value="success">Sukses</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Gagal</option>
                    </select>
                </div>

                <div>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                        Event
                    </span>
                    <select value={filterEvent} onChange={(e) => setFilterEvent((e.target as any).value)} style={selectStyle}>
                        <option value="">Semua</option>
                        {filters.events.map((event: any) => (
                            <option key={event} value={event}>{event}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                        Kelas
                    </span>
                    <select value={filterClass} onChange={(e) => setFilterClass((e.target as any).value)} style={selectStyle}>
                        <option value="">Semua</option>
                        {filters.classes.map((cls: any) => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                        Dari
                    </span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate((e.target as any).value)}
                        style={selectStyle}
                    />
                </div>

                <div>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                        Sampai
                    </span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate((e.target as any).value)}
                        style={selectStyle}
                    />
                </div>

                {/* Reset + Count row */}
                <div style={{
                    gridColumn: isMobile ? '1 / -1' : 'auto',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                }}>
                    {hasActiveFilters && (
                        <button
                            onClick={() => {
                                setFilterStatus('');
                                setFilterEvent('');
                                setFilterClass('');
                                setStartDate('');
                                setEndDate('');
                            }}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'rgba(239,68,68,0.2)',
                                color: '#ef4444',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <X size={14} /> Reset
                        </button>
                    )}
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                        {filteredTransactions.length} transaksi
                    </span>
                </div>
            </div>

            {/* =================== MOBILE: Card Layout =================== */}
            {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredTransactions.length === 0 ? (
                        <div style={{
                            background: '#0a0a0a',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '3rem 1rem',
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.3)'
                        }}>
                            <ShoppingCart size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                            <p>{transactions.length === 0 ? 'Belum ada transaksi' : 'Tidak ada transaksi yang sesuai filter'}</p>
                        </div>
                    ) : (
                        filteredTransactions.map(tx => {
                            const txId = tx.id || tx._id;
                            const isExpanded = expandedId === txId;
                            const statusStyle = getStatusStyle(tx.status);

                            return (
                                <div
                                    key={txId}
                                    onClick={() => setExpandedId(isExpanded ? null : txId)}
                                    style={{
                                        background: isExpanded ? 'rgba(57,255,20,0.03)' : '#0a0a0a',
                                        borderRadius: '16px',
                                        border: isExpanded
                                            ? '1px solid rgba(57,255,20,0.15)'
                                            : '1px solid rgba(255,255,255,0.05)',
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {/* Card Header: Order ID + Status */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            color: 'rgba(255,255,255,0.6)'
                                        }}>
                                            #{txId}
                                        </span>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.65rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            background: statusStyle.bg,
                                            color: statusStyle.color
                                        }}>
                                            {getStatusLabel(tx.status)}
                                        </span>
                                    </div>

                                    {/* Card Body: Email, Items, Total */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        gap: '0.5rem',
                                        alignItems: 'end'
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white', wordBreak: 'break-all' }}>
                                                {tx.email}
                                            </p>
                                            {tx.whatsapp && (
                                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                                                    {tx.whatsapp}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{
                                                fontWeight: '900',
                                                color: '#39FF14',
                                                fontSize: '1rem',
                                                fontStyle: 'italic'
                                            }}>
                                                {formatPrice(tx.totalPrice || tx.total_price)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card Footer: Items count + Date */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '0.75rem',
                                        paddingTop: '0.5rem',
                                        borderTop: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <span style={{
                                            background: 'rgba(57,255,20,0.1)',
                                            color: '#39FF14',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: '700'
                                        }}>
                                            {tx.items?.length || 0} foto
                                        </span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: 'rgba(255,255,255,0.4)'
                                        }}>
                                            {formatDate(tx.createdAt || tx.created_at)}
                                        </span>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && tx.items && tx.items.length > 0 && renderExpandedDetails(tx)}
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* =================== DESKTOP: Table Layout =================== */
                <div style={{
                    background: '#0a0a0a',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'auto'
                }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Order ID</th>
                                <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Email / WA</th>
                                <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Items</th>
                                <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Total</th>
                                <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Status</th>
                                <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Tanggal & Jam</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(tx => {
                                const txId = tx.id || tx._id;
                                const isExpanded = expandedId === txId;
                                const statusStyle = getStatusStyle(tx.status);

                                return (
                                    <>
                                        <tr
                                            key={txId}
                                            style={{
                                                borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer',
                                                background: isExpanded ? 'rgba(57,255,20,0.05)' : 'transparent'
                                            }}
                                            onClick={() => setExpandedId(isExpanded ? null : txId)}
                                        >
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                #{txId}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div>{tx.email}</div>
                                                {tx.whatsapp && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{tx.whatsapp}</div>}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    background: 'rgba(57,255,20,0.1)',
                                                    color: '#39FF14',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {tx.items?.length || 0} foto
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: '900', color: '#39FF14' }}>
                                                {formatPrice(tx.totalPrice || tx.total_price)}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    background: statusStyle.bg,
                                                    color: statusStyle.color
                                                }}>
                                                    {getStatusLabel(tx.status)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                                                {formatDate(tx.createdAt || tx.created_at)}
                                            </td>
                                        </tr>
                                        {isExpanded && tx.items && tx.items.length > 0 && (
                                            <tr key={`${txId}-details`}>
                                                <td colSpan={6} style={{
                                                    padding: '0 1rem 1rem 1rem',
                                                    background: 'rgba(57,255,20,0.02)',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    {renderExpandedDetails(tx)}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                        <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}><ShoppingCart size={40} /></div>
                                        <p>{transactions.length === 0 ? 'Belum ada transaksi' : 'Tidak ada transaksi yang sesuai filter'}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
}
