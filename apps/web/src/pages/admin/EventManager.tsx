import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
    getAdminEvents, getAdminPhotos, deleteEvent, deletePhoto, deleteClass, createClass
} from '../../services/api';
import {
    Calendar, Plus, Edit, Trash2, AlertTriangle, Image, ImageOff,
    ChevronRight, ChevronDown, FolderOpen, Search, ArrowLeft, Layers, Eye, Check, Circle
} from 'lucide-react';

export default function EventManager() {
    const { user, isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState<any[]>([]);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState<any>(null);
    const [expandedClasses, setExpandedClasses] = useState<any>({});
    const [searchNo, setSearchNo] = useState('');
    const [deleteModal, setDeleteModal] = useState<any>({ show: false, type: '', id: null, name: '' });
    const [newClassName, setNewClassName] = useState('');
    const [addingClass, setAddingClass] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [eventsRes, photosRes] = await Promise.all([
                getAdminEvents(),
                getAdminPhotos()
            ]);
            setEvents(eventsRes.data);
            setPhotos(photosRes.data);
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get the selected event object
    const selectedEvent = useMemo(() => {
        return events.find(e => (e.id || e._id) === selectedEventId);
    }, [events, selectedEventId]);

    // Get photos for the selected event
    const eventPhotos = useMemo(() => {
        if (!selectedEventId) return [];
        return photos.filter(p => p.event_id === selectedEventId);
    }, [photos, selectedEventId]);

    // Get unique classes for the selected event
    const eventClasses = useMemo(() => {
        if (!selectedEvent) return [];
        // Get classes from event.classes (from backend) + unique classes from photos
        const classesFromEvent = (selectedEvent.classes || []).map((c: any) => ({
            id: c.id || c._id,
            name: c.name
        }));
        // Also add any classes from photos that may not be in event.classes
        const classNamesFromEvent = new Set(classesFromEvent.map((c: any) => c.name));
        const classesFromPhotos = [...new Set(eventPhotos.map(p => p.class).filter(Boolean))]
            .filter(cn => !classNamesFromEvent.has(cn))
            .map(cn => ({ id: `photo_class_${cn}`, name: cn }));

        return [...classesFromEvent, ...classesFromPhotos];
    }, [selectedEvent, eventPhotos]);

    // Get photos for a specific class, filtered by search
    const getClassPhotos = (className: any) => {
        return eventPhotos.filter(p => {
            const matchesClass = p.class === className;
            const matchesSearch = searchNo === '' ||
                (p.start_no || p.startNo || '').toString().includes(searchNo);
            return matchesClass && matchesSearch;
        });
    };

    // Get photo count per event
    const getEventPhotoCount = (eventId: any) => {
        return photos.filter(p => p.event_id === eventId).length;
    };

    // Get class count for an event
    const getEventClassCount = (event: any) => {
        return (event.classes || []).length;
    };

    const toggleClass = (className: any) => {
        setExpandedClasses((prev: any) => ({ ...prev, [className]: !prev[className] }));
    };

    const expandAllClasses = () => {
        const all: Record<string, boolean> = {};
        eventClasses.forEach(c => { all[c.name] = true; });
        setExpandedClasses(all);
    };

    const collapseAllClasses = () => {
        setExpandedClasses({});
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
                setEvents(events.filter(e => (e.id || e._id) !== deleteModal.id));
                setPhotos(photos.filter(p => p.event_id !== deleteModal.id));
                if (selectedEventId === deleteModal.id) setSelectedEventId(null);
            } else if (deleteModal.type === 'photo') {
                await deletePhoto(deleteModal.id);
                setPhotos(photos.filter(p => (p.id || p._id) !== deleteModal.id));
            } else if (deleteModal.type === 'class') {
                await deleteClass(deleteModal.id);
                // Refresh data after class deletion (photos in this class are also deleted)
                await fetchData();
            }
            closeDeleteModal();
        } catch (error: any) {
            console.error('Delete error:', error);
            alert('Gagal menghapus: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAddClass = async () => {
        if (!newClassName.trim() || !selectedEventId) return;
        try {
            await createClass(selectedEventId, newClassName.trim());
            setNewClassName('');
            setAddingClass(false);
            await fetchData();
        } catch (error: any) {
            console.error('Add class error:', error);
            alert('Gagal menambah kelas: ' + (error.response?.data?.message || error.message));
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Event Manager">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Event Manager" subtitle="Kelola event, kelas, dan katalog foto">
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
                        maxWidth: '440px',
                        width: '100%',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                                <AlertTriangle size={24} color="#ef4444" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '900', textTransform: 'uppercase' }}>
                                    Hapus {deleteModal.type === 'event' ? 'Event' : deleteModal.type === 'class' ? 'Kelas' : 'Foto'}?
                                </h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                    {deleteModal.type === 'event'
                                        ? 'Semua foto & varian dalam event ini akan dihapus dari penyimpanan!'
                                        : deleteModal.type === 'class'
                                            ? 'Semua foto dalam kelas ini akan dihapus dari penyimpanan!'
                                            : 'Foto dan varian akan dihapus dari penyimpanan!'}
                                </p>
                            </div>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            Anda yakin ingin menghapus <span style={{ color: 'white', fontWeight: '700' }}>"{deleteModal.name}"</span>?
                        </p>
                        <p style={{ color: 'rgba(57,255,20,0.7)', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
                            <Check size={12} /> History transaksi tetap tersimpan
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={closeDeleteModal} style={{
                                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                padding: '0.75rem', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer'
                            }}>Batal</button>
                            <button onClick={confirmDelete} style={{
                                flex: 1, background: '#ef4444', border: 'none', padding: '0.75rem', borderRadius: '12px',
                                color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}>
                                <Trash2 size={16} /> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!selectedEventId ? (
                /* ==================== EVENT LIST VIEW ==================== */
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
                                Semua Event
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                {events.length} event • {photos.length} total foto
                            </p>
                        </div>
                        <Link to="/admin/events/create" style={{
                            background: '#39FF14', color: 'black', padding: '0.625rem 1.25rem', borderRadius: '10px',
                            fontSize: '0.8rem', fontWeight: '900', textDecoration: 'none', display: 'flex',
                            alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase'
                        }}>
                            <Plus size={16} /> Tambah Event
                        </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                        {events.map(event => {
                            const eventId = event.id || event._id;
                            const photoCount = getEventPhotoCount(eventId);
                            const classCount = getEventClassCount(event);

                            return (
                                <div
                                    key={eventId}
                                    style={{
                                        background: '#0a0a0a',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedEventId(eventId)}
                                >
                                    {/* Event Image */}
                                    <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
                                        <img
                                            src={event.imageUrl || '/placeholder.jpg'}
                                            alt={event.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { (e.target as HTMLInputElement).src = '/placeholder.jpg'; }}
                                        />
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)'
                                        }} />
                                        {/* Status Badge */}
                                        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                                            <span style={{
                                                fontSize: '9px', padding: '0.25rem 0.5rem', borderRadius: '6px',
                                                fontWeight: '800', textTransform: 'uppercase',
                                                background: event.status === 'approved' ? 'rgba(57,255,20,0.2)' :
                                                    event.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                                                color: event.status === 'approved' ? '#39FF14' :
                                                    event.status === 'pending' ? '#f59e0b' : '#ef4444',
                                                border: `1px solid ${event.status === 'approved' ? 'rgba(57,255,20,0.3)' :
                                                    event.status === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`
                                            }}>
                                                {event.status === 'approved' ? (<><Circle size={8} fill="currentColor" /> Live</>) : event.status === 'pending' ? (<><Circle size={8} fill="currentColor" /> Pending</>) : (<><Circle size={8} fill="currentColor" /> Ditolak</>)}
                                            </span>
                                        </div>
                                        {/* Event Name */}
                                        <div style={{ position: 'absolute', bottom: '0.75rem', left: '1rem', right: '1rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                                {event.name}
                                            </h3>
                                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                                                {event.location} {event.date ? `• ${event.date}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Event Stats & Actions */}
                                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Image size={14} color="rgba(255,255,255,0.4)" />
                                                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{photoCount}</span>
                                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>foto</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Layers size={14} color="rgba(255,255,255,0.4)" />
                                                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{classCount}</span>
                                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>kelas</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                                            <Link to={`/admin/events/${eventId}/edit`} style={{
                                                padding: '0.4rem', background: 'rgba(255,255,255,0.06)', borderRadius: '8px',
                                                color: 'rgba(255,255,255,0.5)', textDecoration: 'none', display: 'flex'
                                            }}>
                                                <Edit size={14} />
                                            </Link>
                                            <button onClick={() => openDeleteModal('event', eventId, event.name)} style={{
                                                padding: '0.4rem', background: 'rgba(255,255,255,0.06)', borderRadius: '8px',
                                                border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex'
                                            }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {events.length === 0 && (
                            <div style={{
                                gridColumn: '1 / -1', background: '#0a0a0a', padding: '3rem', borderRadius: '20px',
                                border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center'
                            }}>
                                <Calendar size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: '1rem' }} />
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                                    Belum ada event. Tambahkan event baru!
                                </p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* ==================== EVENT DETAIL VIEW ==================== */
                <>
                    {/* Header */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <button
                            onClick={() => { setSelectedEventId(null); setSearchNo(''); setExpandedClasses({}); }}
                            style={{
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                padding: '0.5rem 1rem', borderRadius: '10px', color: 'rgba(255,255,255,0.7)',
                                cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', display: 'flex',
                                alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'
                            }}
                        >
                            <ArrowLeft size={16} /> Kembali ke Daftar Event
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {selectedEvent?.imageUrl && (
                                    <img src={selectedEvent.imageUrl} alt="" style={{
                                        width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover',
                                        border: '2px solid rgba(57,255,20,0.3)'
                                    }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                                )}
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
                                        {selectedEvent?.name}
                                    </h2>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                        {selectedEvent?.location} • {eventClasses.length} kelas • {eventPhotos.length} foto
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <Link to={`/admin/events/${selectedEventId}/edit`} style={{
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '0.5rem 1rem', borderRadius: '10px', color: 'white', textDecoration: 'none',
                                    fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                }}>
                                    <Edit size={14} /> Edit Event
                                </Link>
                                <Link to="/admin/photos/create" style={{
                                    background: '#39FF14', color: 'black', padding: '0.5rem 1rem', borderRadius: '10px',
                                    fontSize: '0.75rem', fontWeight: '900', textDecoration: 'none', display: 'flex',
                                    alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase'
                                }}>
                                    <Plus size={14} /> Upload Foto
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Search + Controls */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Cari No. Start..."
                                value={searchNo}
                                onChange={(e) => setSearchNo((e.target as any).value)}
                                style={{
                                    width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px', padding: '0.6rem 0.8rem 0.6rem 2.2rem', color: 'white',
                                    fontSize: '0.8rem', boxSizing: 'border-box' as const
                                }}
                            />
                            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <button onClick={expandAllClasses} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            padding: '0.5rem 0.75rem', borderRadius: '8px', color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer', fontSize: '0.7rem', fontWeight: '700'
                        }}>Buka Semua</button>
                        <button onClick={collapseAllClasses} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            padding: '0.5rem 0.75rem', borderRadius: '8px', color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer', fontSize: '0.7rem', fontWeight: '700'
                        }}>Tutup Semua</button>
                        {!addingClass ? (
                            <button onClick={() => setAddingClass(true)} style={{
                                background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)',
                                padding: '0.5rem 0.75rem', borderRadius: '8px', color: '#39FF14',
                                cursor: 'pointer', fontSize: '0.7rem', fontWeight: '700', display: 'flex',
                                alignItems: 'center', gap: '0.3rem'
                            }}>
                                <Plus size={12} /> Tambah Kelas
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName((e.target as any).value)}
                                    placeholder="Nama kelas..."
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                                    autoFocus
                                    style={{
                                        background: '#0a0a0a', border: '1px solid rgba(57,255,20,0.3)',
                                        borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'white',
                                        fontSize: '0.75rem', width: '140px'
                                    }}
                                />
                                <button onClick={handleAddClass} style={{
                                    background: '#39FF14', border: 'none', padding: '0.5rem 0.75rem',
                                    borderRadius: '8px', color: 'black', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '900'
                                }}>OK</button>
                                <button onClick={() => { setAddingClass(false); setNewClassName(''); }} style={{
                                    background: 'rgba(255,255,255,0.06)', border: 'none', padding: '0.5rem 0.75rem',
                                    borderRadius: '8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.7rem'
                                }}>Batal</button>
                            </div>
                        )}
                    </div>

                    {/* Classes Accordion */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {eventClasses.map(cls => {
                            const classPhotos = getClassPhotos(cls.name);
                            const isExpanded = expandedClasses[cls.name];

                            return (
                                <div key={cls.id} style={{
                                    background: '#0a0a0a', borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden'
                                }}>
                                    {/* Class Header */}
                                    <div
                                        onClick={() => toggleClass(cls.name)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '1rem 1.25rem', cursor: 'pointer', transition: 'background 0.15s',
                                            background: isExpanded ? 'rgba(57,255,20,0.03)' : 'transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {isExpanded ? <ChevronDown size={18} color="#39FF14" /> : <ChevronRight size={18} color="rgba(255,255,255,0.4)" />}
                                            <FolderOpen size={18} color={isExpanded ? '#39FF14' : 'rgba(255,255,255,0.4)'} />
                                            <div>
                                                <p style={{ fontWeight: '900', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                                    {cls.name}
                                                </p>
                                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                                                    {classPhotos.length} foto
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                                            <Link to={`/event/${selectedEventId}/class/${encodeURIComponent(cls.name)}`} target="_blank" style={{
                                                padding: '0.35rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px',
                                                color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'flex'
                                            }} title="Lihat halaman publik">
                                                <Eye size={14} />
                                            </Link>
                                            <button onClick={() => openDeleteModal('class', cls.id, cls.name)} style={{
                                                padding: '0.35rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px',
                                                border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', display: 'flex'
                                            }} title="Hapus kelas">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Class Photos Grid */}
                                    {isExpanded && (
                                        <div style={{
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                            padding: '1rem'
                                        }}>
                                            {classPhotos.length > 0 ? (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                                    gap: '0.75rem'
                                                }}>
                                                    {classPhotos.map(photo => {
                                                        const photoId = photo.id || photo._id;
                                                        return (
                                                            <div key={photoId} style={{
                                                                background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                                                                overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)'
                                                            }}>
                                                                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                                                                    <img
                                                                        src={photo.photoUrl || '/placeholder.jpg'}
                                                                        alt={`#${photo.start_no || photo.startNo}`}
                                                                        loading="lazy"
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        onError={(e) => { (e.target as HTMLInputElement).src = '/placeholder.jpg'; }}
                                                                    />
                                                                    {/* Recap count badge */}
                                                                    {(photo.recap_count || 0) > 0 && (
                                                                        <span style={{
                                                                            position: 'absolute', top: '0.4rem', left: '0.4rem',
                                                                            background: '#39FF14', color: 'black', fontSize: '8px',
                                                                            fontWeight: '900', padding: '0.15rem 0.35rem', borderRadius: '4px'
                                                                        }}>
                                                                            {photo.recap_count} V
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ padding: '0.5rem 0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div>
                                                                        <p style={{ fontWeight: '800', fontSize: '0.75rem' }}>
                                                                            #{photo.start_no || photo.startNo}
                                                                        </p>
                                                                        <p style={{ color: '#39FF14', fontSize: '0.65rem', fontWeight: '700' }}>
                                                                            Rp {(photo.price || 0).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                                        <Link to={`/admin/photos/${photoId}/edit`} style={{
                                                                            color: 'rgba(255,255,255,0.4)', display: 'flex'
                                                                        }}>
                                                                            <Edit size={12} />
                                                                        </Link>
                                                                        <button onClick={() => openDeleteModal('photo', photoId, `Foto #${photo.start_no || photo.startNo}`)} style={{
                                                                            background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                                                                            cursor: 'pointer', display: 'flex', padding: 0
                                                                        }}>
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>
                                                    <ImageOff size={28} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                                                    <p style={{ fontSize: '0.8rem' }}>
                                                        {searchNo ? 'Tidak ditemukan foto dengan nomor start tersebut' : 'Belum ada foto di kelas ini'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {eventClasses.length === 0 && (
                            <div style={{
                                background: '#0a0a0a', borderRadius: '16px', padding: '2.5rem',
                                border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center'
                            }}>
                                <FolderOpen size={40} color="rgba(255,255,255,0.15)" style={{ marginBottom: '0.75rem' }} />
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                                    Belum ada kelas di event ini. Tambahkan kelas baru!
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
