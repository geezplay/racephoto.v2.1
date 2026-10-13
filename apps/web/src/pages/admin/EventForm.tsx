import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getAdminEvent, createEvent, updateEvent, createClass, deleteClass } from '../../services/api';
import { ArrowLeft, Calendar, Hourglass, Save, Plus, Flag, Tag, Trash2, Lightbulb } from 'lucide-react';

export default function EventForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<any>({
        name: '',
        date: '',
        location: '',
        image: null
    });
    const [preview, setPreview] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [newClassName, setNewClassName] = useState('');
    const [addingClass, setAddingClass] = useState(false);

    useEffect(() => {
        if (isEdit) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            const res = await getAdminEvent(id);
            const event = res.data;
            setFormData({
                name: event.name || '',
                date: event.date || '',
                location: event.location || '',
                image: null
            });
            if (event.imageUrl) {
                setPreview(event.imageUrl);
            }
            // Load classes
            if (event.classes) {
                setClasses(event.classes);
            }
        } catch (error: any) {
            console.error('Error fetching event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: any) => {
        const file = (e.target as HTMLInputElement).files![0];
        if (file) {
            setFormData((prev: any) => ({ ...prev, image: file }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('date', formData.date);
            data.append('location', formData.location);
            if (formData.image) {
                data.append('image', formData.image);
            }

            if (isEdit) {
                await updateEvent(id, data);
            } else {
                await createEvent(data);
            }
            navigate('/admin');
        } catch (error: any) {
            console.error('Error saving event:', error);
            alert('Gagal menyimpan event');
        } finally {
            setSaving(false);
        }
    };

    const handleAddClass = async () => {
        if (!newClassName.trim() || !isEdit) return;
        setAddingClass(true);
        try {
            const res = await createClass(id, newClassName.trim());
            setClasses([...classes, res.data]);
            setNewClassName('');
        } catch (error: any) {
            console.error('Error adding class:', error);
            alert('Gagal menambah kelas');
        } finally {
            setAddingClass(false);
        }
    };

    const handleDeleteClass = async (classId: any, className: any) => {
        if (!confirm(`Hapus kelas "${className}"?`)) return;
        try {
            await deleteClass(classId);
            setClasses(classes.filter(c => c.id !== classId));
        } catch (error: any) {
            console.error('Error deleting class:', error);
            alert('Gagal menghapus kelas');
        }
    };

    if (loading) {
        return (
            <AdminLayout title={isEdit ? 'Edit Event' : 'Tambah Event'}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={isEdit ? 'Edit Event' : 'Tambah Event Baru'} subtitle="Kelola data event">
            <div style={{ maxWidth: '800px' }}>
                <Link
                    to="/admin"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'none',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem'
                    }}
                >
                    <ArrowLeft size={16} /> Kembali ke Dashboard
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: isEdit ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                    {/* Event Form */}
                    <form onSubmit={handleSubmit} style={{
                        background: '#0a0a0a',
                        padding: '2rem',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            marginBottom: '1.5rem',
                            color: '#39FF14'
                        }}>
                            <Calendar size={18} /> Detail Event
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Name */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    fontWeight: '900',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.1em',
                                    marginBottom: '0.5rem'
                                }}>
                                    Nama Event
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box' as const
                                    }}
                                    placeholder="Nama event..."
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    fontWeight: '900',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.1em',
                                    marginBottom: '0.5rem'
                                }}>
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box' as const
                                    }}
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    fontWeight: '900',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.1em',
                                    marginBottom: '0.5rem'
                                }}>
                                    Lokasi
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box' as const
                                    }}
                                    placeholder="Lokasi event..."
                                />
                            </div>

                            {/* Image */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    fontWeight: '900',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.1em',
                                    marginBottom: '0.5rem'
                                }}>
                                    Gambar Event
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        boxSizing: 'border-box' as const
                                    }}
                                />
                                {preview && (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        style={{
                                            marginTop: '1rem',
                                            width: '100%',
                                            maxHeight: '200px',
                                            objectFit: 'cover',
                                            borderRadius: '12px'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    background: '#39FF14',
                                    color: 'black',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    fontStyle: 'italic',
                                    border: 'none',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.5 : 1,
                                    boxShadow: '0 15px 30px rgba(57,255,20,0.3)'
                                }}
                            >
                                {saving ? (<><Hourglass size={16} /> Menyimpan...</>) : isEdit ? (<><Save size={16} /> Update Event</>) : (<><Plus size={16} /> Tambah Event</>)}
                            </button>
                        </div>
                    </form>

                    {/* Classes Section - Only show when editing */}
                    {isEdit && (
                        <div style={{
                            background: '#0a0a0a',
                            padding: '2rem',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <h3 style={{
                                fontSize: '1rem',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                marginBottom: '1.5rem',
                                color: '#39FF14'
                            }}>
                                <Flag size={18} /> Kelas Balap
                            </h3>

                            {/* Add Class Form */}
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '1.5rem'
                            }}>
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName((e.target as any).value)}
                                    placeholder="Nama kelas baru..."
                                    style={{
                                        flex: 1,
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '0.75rem',
                                        color: 'white',
                                        fontSize: '0.875rem'
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddClass())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddClass}
                                    disabled={addingClass || !newClassName.trim()}
                                    style={{
                                        background: '#39FF14',
                                        color: 'black',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: '700',
                                        cursor: addingClass || !newClassName.trim() ? 'not-allowed' : 'pointer',
                                        opacity: addingClass || !newClassName.trim() ? 0.5 : 1
                                    }}
                                >
                                    {addingClass ? '...' : (<><Plus size={14} /> Tambah</>)}
                                </button>
                            </div>

                            {/* Classes List */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {classes.length === 0 ? (
                                    <div style={{
                                        padding: '2rem',
                                        textAlign: 'center',
                                        color: 'rgba(255,255,255,0.3)',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '12px'
                                    }}>
                                        <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}><Flag size={32} /></div>
                                        <p style={{ fontSize: '0.875rem' }}>Belum ada kelas. Tambahkan kelas baru!</p>
                                    </div>
                                ) : (
                                    classes.map(cls => (
                                        <div
                                            key={cls.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'rgba(0,0,0,0.3)',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.05)'
                                            }}
                                        >
                                            <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>
                                                <Tag size={16} /> {cls.name}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteClass(cls.id, cls.name)}
                                                style={{
                                                    background: 'rgba(239,68,68,0.2)',
                                                    border: 'none',
                                                    padding: '0.375rem 0.5rem',
                                                    borderRadius: '4px',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <p style={{
                                marginTop: '1rem',
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.3)',
                                fontStyle: 'italic'
                            }}>
                                <Lightbulb size={14} /> Kelas balap akan muncul saat upload foto untuk event ini
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
