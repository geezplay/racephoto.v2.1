import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getAdminUpcomingEvents, deleteUpcomingEvent, toggleEventPublish } from '../../services/api';
import { Calendar, MapPin, Clock, Eye, EyeOff, Edit, Trash2, Plus, ExternalLink } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
    drag: 'Drag Race',
    drift: 'Drift',
    rally: 'Rally',
    touring: 'Touring',
    moto: 'Moto GP',
    road_race: 'Road Race'
};

export default function UpcomingEventList() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await getAdminUpcomingEvents();
            setEvents(res.data);
        } catch (error: any) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: any) => {
        if (!confirm('Hapus event ini?')) return;
        try {
            await deleteUpcomingEvent(id);
            fetchEvents();
        } catch (error: any) {
            console.error('Error deleting event:', error);
            alert('Gagal menghapus event');
        }
    };

    const handleTogglePublish = async (id: any) => {
        try {
            await toggleEventPublish(id);
            fetchEvents();
        } catch (error: any) {
            console.error('Error toggling publish:', error);
        }
    };

    const formatDate = (dateStr: any) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <AdminLayout title="Event Calendar">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Event Calendar" subtitle="Kelola jadwal event mendatang">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.75rem', color: '#39FF14'
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#39FF14' }}></span>
                        Upcoming
                    </span>
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.75rem', color: '#ef4444'
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                        Expired
                    </span>
                </div>
                <Link to="/admin/upcoming-events/new" style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: '#39FF14', color: 'black',
                    padding: '0.75rem 1.5rem', borderRadius: '8px',
                    fontWeight: 700, fontSize: '0.875rem',
                    textDecoration: 'none'
                }}>
                    <Plus size={18} /> Tambah Event
                </Link>
            </div>

            {/* Events Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 320px))',
                gap: '1.5rem',
                justifyContent: 'start'
            }}>
                {events.map(event => (
                    <div key={event.id} style={{
                        background: '#0a0a0a',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: `2px solid ${event.isExpired ? 'rgba(239,68,68,0.3)' : 'rgba(57,255,20,0.2)'}`,
                        opacity: event.isExpired ? 0.7 : 1,
                        transition: 'all 0.3s'
                    }}>
                        {/* Image */}
                        <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                            <img
                                src={event.imageUrl || 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=400'}
                                alt={event.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute', top: '0.75rem', left: '0.75rem',
                                background: event.isExpired ? 'rgba(239,68,68,0.9)' : 'rgba(57,255,20,0.9)',
                                color: event.isExpired ? 'white' : 'black',
                                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase'
                            }}>
                                {event.isExpired ? 'Expired' : 'Upcoming'}
                            </div>
                            <div style={{
                                position: 'absolute', top: '0.75rem', right: '0.75rem',
                                background: 'rgba(0,0,0,0.8)',
                                color: '#00F0FF',
                                padding: '0.25rem 0.75rem', borderRadius: '6px',
                                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase'
                            }}>
                                {CATEGORY_LABELS[event.category] || event.category}
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                                {event.title}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                    <MapPin size={14} style={{ color: '#00F0FF' }} />
                                    {event.location || 'TBA'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                    <Clock size={14} style={{ color: '#00F0FF' }} />
                                    {formatDate(event.start_time)}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                                <button onClick={() => handleTogglePublish(event.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: event.is_published ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${event.is_published ? 'rgba(57,255,20,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                    color: event.is_published ? '#39FF14' : 'rgba(255,255,255,0.5)',
                                    padding: '0.5rem 0.75rem', borderRadius: '6px',
                                    fontSize: '0.75rem', cursor: 'pointer'
                                }}>
                                    {event.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                                    {event.is_published ? 'Published' : 'Draft'}
                                </button>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {event.external_link && (
                                        <a href={event.external_link} target="_blank" rel="noopener noreferrer" style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)',
                                            color: '#00F0FF', width: '36px', height: '36px', borderRadius: '6px'
                                        }}>
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                    <Link to={`/admin/upcoming-events/${event.id}/edit`} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', width: '36px', height: '36px', borderRadius: '6px'
                                    }}>
                                        <Edit size={14} />
                                    </Link>
                                    <button onClick={() => handleDelete(event.id)} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                        color: '#ef4444', width: '36px', height: '36px', borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {events.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '5rem 0',
                    color: 'rgba(255,255,255,0.3)'
                }}>
                    <Calendar size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Upcoming Races</h3>
                    <p style={{ fontSize: '0.875rem' }}>The engines are cooling down.</p>
                    <Link to="/admin/upcoming-events/new" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: '#39FF14', color: 'black',
                        padding: '0.75rem 1.5rem', borderRadius: '8px',
                        fontWeight: 700, fontSize: '0.875rem',
                        textDecoration: 'none', marginTop: '1.5rem'
                    }}>
                        <Plus size={18} /> Tambah Event Pertama
                    </Link>
                </div>
            )}
        </AdminLayout>
    );
}
