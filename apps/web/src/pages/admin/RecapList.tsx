import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getAdminPhotos } from '../../services/api';
import { Download, Camera } from 'lucide-react';

export default function RecapList() {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchPhotos();
    }, []);

    const fetchPhotos = async () => {
        try {
            const res = await getAdminPhotos();
            setPhotos(res.data);
        } catch (error: any) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPhotos = photos.filter(photo => {
        const term = search.toLowerCase();
        return (
            (photo.startNo || photo.start_no || '').toLowerCase().includes(term) ||
            (photo.event_name || '').toLowerCase().includes(term) ||
            (photo.class || '').toLowerCase().includes(term)
        );
    });

    if (loading) {
        return (
            <AdminLayout title="Recap Foto">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Kelola Recap Foto" subtitle="Upload foto HD untuk dikirim ke pembeli">
            {/* Search */}
            <div style={{ marginBottom: '2rem', maxWidth: '400px' }}>
                <input
                    type="text"
                    placeholder="Cari nomor start, event, atau kelas..."
                    value={search}
                    onChange={(e) => setSearch((e.target as any).value)}
                    style={{
                        width: '100%',
                        background: '#0a0a0a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box' as const
                    }}
                />
            </div>

            {/* Photo Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {filteredPhotos.map(photo => (
                    <div
                        key={photo.id || photo._id}
                        style={{
                            background: '#0a0a0a',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ position: 'relative', aspectRatio: '4/3' }}>
                            <img
                                src={photo.url || photo.image}
                                alt={`Start #${photo.startNo}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute',
                                top: '0.5rem',
                                left: '0.5rem',
                                background: 'rgba(0,0,0,0.8)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '900'
                            }}>
                                #{photo.startNo || photo.start_no}
                            </div>
                            <div style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '900',
                                background: (photo.recap_count || 0) > 0 ? '#39FF14' : 'rgba(239,68,68,0.8)',
                                color: (photo.recap_count || 0) > 0 ? 'black' : 'white'
                            }}>
                                {photo.recap_count || 0} Recap
                            </div>
                        </div>
                        <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                {photo.event_name}
                            </p>
                            <p style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                {photo.class}
                            </p>

                            <div style={{ marginTop: 'auto' }}>
                                <Link
                                    to={`/admin/recap/${photo.id || photo._id}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        textDecoration: 'none',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        fontSize: '0.875rem',
                                        fontWeight: '700',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <Download size={16} /> Upload Recap
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredPhotos.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: '#0a0a0a',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ marginBottom: '0.5rem', opacity: 0.2 }}><Camera size={40} /></div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'rgba(255,255,255,0.4)' }}>
                        {search ? 'Tidak ada foto ditemukan' : 'Belum ada foto'}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
                        {search ? 'Coba kata kunci lain' : 'Tambahkan foto terlebih dahulu'}
                    </p>
                </div>
            )}
        </AdminLayout>
    );
}
