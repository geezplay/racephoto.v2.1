import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { getDashboard, getAdminEvents, getAdminPhotos, deleteEvent, deletePhoto } from '../../services/api';
import {
    TrendingUp,
    ShoppingCart,
    Image,
    Calendar,
    AlertTriangle,
    Trash2,
    Plus,
    Edit,
    ImageOff
} from 'lucide-react';

export default function Dashboard() {
    const { user, isSuperAdmin } = useAuth();
    const [stats, setStats] = useState<any>({ totalRevenue: 0, totalOrders: 0, totalPhotos: 0, totalEvents: 0 });
    const [events, setEvents] = useState<any[]>([]);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<any>({ show: false, type: '', id: null, name: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, eventsRes, photosRes] = await Promise.all([
                getDashboard(),
                getAdminEvents(),
                getAdminPhotos()
            ]);
            setStats(statsRes.data);
            setEvents(eventsRes.data.slice(0, 10));
            setPhotos(photosRes.data.slice(0, 5));
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (type: any, id: any, name: any) => {
        setDeleteModal({ show: true, type, id, name });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ show: false, type: '', id: null, name: '' });
    };

    const confirmDelete = async () => {
        try {
            if (deleteModal.type === 'event') {
                await deleteEvent(deleteModal.id);
                setEvents(events.filter(e => e.id !== deleteModal.id));
            } else if (deleteModal.type === 'photo') {
                await deletePhoto(deleteModal.id);
                setPhotos(photos.filter(p => p.id !== deleteModal.id));
            }
            closeDeleteModal();
        } catch (error: any) {
            console.error('Delete error:', error);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Control Panel">
            {/* Delete Modal */}
            {deleteModal.show && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: '#0a0a0a',
                        borderRadius: '24px',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '100%',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={24} color="#ef4444" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase' }}>
                                    Hapus {deleteModal.type === 'event' ? 'Event' : 'Foto'}?
                                </h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
                                    Tindakan ini tidak dapat dibatalkan
                                </p>
                            </div>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
                            Anda yakin ingin menghapus <span style={{ color: 'white', fontWeight: '700' }}>"{deleteModal.name}"</span>?
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={closeDeleteModal}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    flex: 1,
                                    background: '#ef4444',
                                    border: 'none',
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Trash2 size={16} /> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    background: '#0a0a0a',
                    padding: '1.5rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s'
                }}>
                    <div style={{ marginBottom: '1rem', color: '#39FF14' }}><TrendingUp size={32} /></div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }}>
                        {isSuperAdmin() ? 'Total Pendapatan' : 'Pendapatan Saya'}
                    </p>
                    <p style={{ fontSize: '1.875rem', fontWeight: '900', color: '#39FF14' }}>
                        Rp {(stats.totalRevenue || 0).toLocaleString()}
                    </p>
                </div>
                <div style={{
                    background: '#0a0a0a',
                    padding: '1.5rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.6)' }}><ShoppingCart size={32} /></div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }}>
                        {isSuperAdmin() ? 'Foto Terjual' : 'Foto Saya Terjual'}
                    </p>
                    <p style={{ fontSize: '1.875rem', fontWeight: '900', color: 'white' }}>
                        {stats.totalOrders || 0}
                    </p>
                </div>
                <div style={{
                    background: '#0a0a0a',
                    padding: '1.5rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.6)' }}><Image size={32} /></div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }}>
                        {isSuperAdmin() ? 'Katalog Aktif' : 'Foto Saya'}
                    </p>
                    <p style={{ fontSize: '1.875rem', fontWeight: '900', color: 'white' }}>
                        {stats.totalPhotos || 0}
                    </p>
                </div>
                <div style={{
                    background: '#0a0a0a',
                    padding: '1.5rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.6)' }}><Calendar size={32} /></div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }}>
                        Total Event
                    </p>
                    <p style={{ fontSize: '1.875rem', fontWeight: '900', color: 'white' }}>
                        {stats.totalEvents || 0}
                    </p>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* Events Section */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
                            Daftar Event
                        </h3>
                        <Link
                            to="/admin/events/create"
                            style={{
                                background: '#39FF14',
                                color: 'black',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '900',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus size={14} /> TAMBAH EVENT
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                        {events.map(event => (
                            <div
                                key={event.id}
                                style={{
                                    background: '#0a0a0a',
                                    padding: '1rem',
                                    borderRadius: '16px',
                                    border: event.status === 'approved' ? '1px solid rgba(255,255,255,0.05)' :
                                        event.status === 'pending' ? '1px solid rgba(245,158,11,0.3)' :
                                            '1px solid rgba(239,68,68,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={event.imageUrl || '/placeholder.jpg'}
                                            alt={event.name}
                                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                                            onError={(e) => { (e.target as HTMLInputElement).src = '/placeholder.jpg'; }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            border: '2px solid #0a0a0a',
                                            background: event.status === 'approved' ? '#39FF14' :
                                                event.status === 'pending' ? '#f59e0b' : '#ef4444'
                                        }} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: '900', fontSize: '0.875rem', textTransform: 'uppercase' }}>{event.name}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase' }}>
                                                {event.location}
                                            </p>
                                            {event.status !== 'approved' && (
                                                <span style={{
                                                    fontSize: '8px',
                                                    padding: '0.125rem 0.375rem',
                                                    borderRadius: '4px',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    background: event.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                                                    color: event.status === 'pending' ? '#f59e0b' : '#ef4444'
                                                }}>
                                                    {event.status === 'pending' ? 'Menunggu Approval' : 'Ditolak'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Link
                                        to={`/admin/events/${event.id}/edit`}
                                        style={{
                                            padding: '0.5rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            color: 'rgba(255,255,255,0.6)',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <Edit size={16} />
                                    </Link>
                                    <button
                                        onClick={() => openDeleteModal('event', event.id, event.name)}
                                        style={{
                                            padding: '0.5rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.6)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {events.length === 0 && (
                            <div style={{
                                background: '#0a0a0a',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                textAlign: 'center'
                            }}>
                                <div style={{ marginBottom: '0.5rem', opacity: 0.2 }}><Calendar size={40} /></div>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                                    Belum ada event. Tambahkan event baru!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Photos Section */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
                            Katalog Foto
                        </h3>
                        <Link
                            to="/admin/photos/create"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '900',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus size={14} /> UPLOAD FOTO
                        </Link>
                    </div>
                    <div style={{
                        background: '#0a0a0a',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', textAlign: 'left', fontSize: '0.75rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Foto</th>
                                    <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>No. Start</th>
                                    <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Harga</th>
                                    <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {photos.map(photo => (
                                    <tr key={photo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <img
                                                src={photo.photoUrl || '/placeholder.jpg'}
                                                alt=""
                                                style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                                                onError={(e) => { (e.target as HTMLInputElement).src = '/placeholder.jpg'; }}
                                            />
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '700' }}>#{photo.start_no || photo.startNo}</td>
                                        <td style={{ padding: '1rem', fontWeight: '900', color: '#39FF14' }}>
                                            Rp {(photo.price || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Link
                                                    to={`/admin/photos/${photo.id}/edit`}
                                                    style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
                                                >
                                                    <Edit size={14} />
                                                </Link>
                                                <button
                                                    onClick={() => openDeleteModal('photo', photo.id, `#${photo.start_no || photo.startNo}`)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'rgba(255,255,255,0.5)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {photos.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                            <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}><ImageOff size={40} /></div>
                                            <p style={{ fontSize: '0.875rem' }}>Belum ada foto. Upload foto baru!</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {photos.length > 5 && (
                            <div style={{
                                padding: '1rem',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                textAlign: 'center'
                            }}>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                    Menampilkan 5 dari {photos.length} foto
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
