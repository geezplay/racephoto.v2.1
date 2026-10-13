import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getPendingEvents, approveEvent, rejectEvent } from '../../services/api';
import { CheckCircle2, XCircle, AlarmClock } from 'lucide-react';

export default function PendingEvents() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingEvents();
    }, []);

    const fetchPendingEvents = async () => {
        try {
            const res = await getPendingEvents();
            setEvents(res.data);
        } catch (error: any) {
            console.error('Error fetching pending events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: any) => {
        try {
            await approveEvent(id);
            setEvents(events.filter(e => e.id !== id));
        } catch (error: any) {
            console.error('Error approving event:', error);
        }
    };

    const handleReject = async (id: any) => {
        const reason = prompt('Alasan penolakan (opsional):');
        try {
            await rejectEvent(id, reason ?? undefined);
            setEvents(events.filter(e => e.id !== id));
        } catch (error: any) {
            console.error('Error rejecting event:', error);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Pending Events">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Pending Events" subtitle="Event yang menunggu persetujuan">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {events.map(event => (
                    <div
                        key={event.id}
                        style={{
                            background: '#0a0a0a',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            border: '1px solid rgba(245,158,11,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img
                                src={event.image || event.imageUrl || '/placeholder.jpg'}
                                alt={event.name}
                                style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                            />
                            <div>
                                <p style={{ fontWeight: '900', fontSize: '1rem', textTransform: 'uppercase' }}>{event.name}</p>
                                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>{event.location}</p>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                                    Diajukan oleh: {event.admin?.name || 'Admin'}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleApprove(event.id)}
                                style={{
                                    background: '#39FF14',
                                    color: 'black',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <CheckCircle2 size={16} /> Setujui
                            </button>
                            <button
                                onClick={() => handleReject(event.id)}
                                style={{
                                    background: 'rgba(239,68,68,0.1)',
                                    color: '#ef4444',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <XCircle size={16} /> Tolak
                            </button>
                        </div>
                    </div>
                ))}
                {events.length === 0 && (
                    <div style={{
                        background: '#0a0a0a',
                        padding: '3rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '0.5rem', opacity: 0.2 }}><AlarmClock size={40} /></div>
                        <p style={{ color: 'rgba(255,255,255,0.3)' }}>Tidak ada event yang menunggu persetujuan</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
