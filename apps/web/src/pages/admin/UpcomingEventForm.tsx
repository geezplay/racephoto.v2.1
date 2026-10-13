import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getAdminUpcomingEvent, createUpcomingEvent, updateUpcomingEvent } from '../../services/api';
import { Calendar, MapPin, Link as LinkIcon, Upload, Save } from 'lucide-react';

const CATEGORIES = [
    { value: 'road_race', label: 'Road Race' },
    { value: 'drag', label: 'Drag Race' },
    { value: 'drift', label: 'Drift' },
    { value: 'rally', label: 'Rally' },
    { value: 'touring', label: 'Touring' },
    { value: 'moto', label: 'Moto GP' }
];

export default function UpcomingEventForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState<any>({
        title: '',
        category: 'road_race',
        location: '',
        start_time: '',
        external_link: '',
        is_published: true
    });
    const [image, setImage] = useState<any>(null);
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    useEffect(() => {
        if (isEdit) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        try {
            const res = await getAdminUpcomingEvent(id);
            const event = res.data;
            setFormData({
                title: event.name || event.title || '',
                category: event.category || 'road_race',
                location: event.location || '',
                start_time: event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : '',
                external_link: event.external_link || '',
                is_published: event.is_published !== false
            });
            if (event.imageUrl) {
                setPreview(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${event.imageUrl}`);
            }
        } catch (error: any) {
            console.error('Error fetching event:', error);
            alert('Gagal memuat data event');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e: any) => {
        const file = (e.target as HTMLInputElement).files![0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!formData.title || !formData.start_time) {
            alert('Judul dan tanggal mulai wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('category', formData.category);
            data.append('location', formData.location);
            data.append('start_time', formData.start_time);
            data.append('external_link', formData.external_link);
            data.append('is_published', formData.is_published);
            if (image) {
                data.append('image', image);
            }

            if (isEdit) {
                await updateUpcomingEvent(id, data);
            } else {
                await createUpcomingEvent(data);
            }

            navigate('/admin/upcoming-events');
        } catch (error: any) {
            console.error('Error saving event:', error);
            alert('Gagal menyimpan event');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <AdminLayout title={isEdit ? 'Edit Event' : 'Tambah Event'}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    const inputStyle = {
        width: '100%',
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '0.875rem',
        color: 'white',
        fontSize: '0.9rem',
        boxSizing: 'border-box' as const
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.7rem',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: '0.5rem'
    };

    return (
        <AdminLayout title={isEdit ? 'Edit Event' : 'Tambah Event'} subtitle="Kelola jadwal event mendatang">
            <form onSubmit={handleSubmit} style={{ maxWidth: '700px' }}>
                <div style={{
                    background: '#0a0a0a',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {/* Image Upload */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Banner/Poster (16:9)</label>
                        <div style={{
                            position: 'relative',
                            aspectRatio: '16/9',
                            background: 'rgba(255,255,255,0.02)',
                            border: '2px dashed rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer'
                        }} onClick={() => document.getElementById('image-upload')!.click()}>
                            {preview ? (
                                <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.3)'
                                }}>
                                    <Upload size={40} style={{ marginBottom: '0.5rem' }} />
                                    <span style={{ fontSize: '0.875rem' }}>Klik untuk upload gambar</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Title */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>Judul Event *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Contoh: Mandalika Track Day Vol 4"
                            required
                            style={inputStyle}
                        />
                    </div>

                    {/* Category & Location */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Kategori</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Lokasi (Venue)</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Contoh: Mandalika Circuit"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Start Time */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>
                            <Calendar size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Tanggal & Jam Mulai * (Kunci Auto-Hide)
                        </label>
                        <input
                            type="datetime-local"
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                            Event akan otomatis hilang dari homepage saat waktu ini tercapai
                        </p>
                    </div>

                    {/* External Link */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>
                            <LinkIcon size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Link Detail/Pendaftaran
                        </label>
                        <input
                            type="url"
                            name="external_link"
                            value={formData.external_link}
                            onChange={handleChange}
                            placeholder="https://..."
                            style={inputStyle}
                        />
                    </div>

                    {/* Publish Toggle */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                name="is_published"
                                checked={formData.is_published}
                                onChange={handleChange}
                                style={{ width: '20px', height: '20px', accentColor: '#39FF14' }}
                            />
                            <span style={{ color: formData.is_published ? '#39FF14' : 'rgba(255,255,255,0.5)' }}>
                                {formData.is_published ? 'Published (Tampil di Homepage)' : 'Draft (Tidak Tampil)'}
                            </span>
                        </label>
                    </div>

                    {/* Submit */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" disabled={loading} style={{
                            flex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            background: '#39FF14', color: 'black',
                            padding: '1rem', borderRadius: '8px',
                            fontWeight: 700, fontSize: '0.9rem',
                            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1
                        }}>
                            <Save size={18} />
                            {loading ? 'Menyimpan...' : (isEdit ? 'Update Event' : 'Simpan Event')}
                        </button>
                        <button type="button" onClick={() => navigate('/admin/upcoming-events')} style={{
                            padding: '1rem 2rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', cursor: 'pointer'
                        }}>
                            Batal
                        </button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
