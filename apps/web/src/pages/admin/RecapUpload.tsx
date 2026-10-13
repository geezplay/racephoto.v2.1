import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getAdminPhoto, uploadRecaps, deleteRecap, generateVariantPreview } from '../../services/api';
import { ArrowLeft, Trash2, Plus, X, Hourglass, Upload, Image as ImageIcon, CheckCircle2, BarChart3, Sparkles } from 'lucide-react';

export default function RecapUpload() {
    const { id } = useParams();
    const [photo, setPhoto] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
    const fileInputRef = useRef<any>(null);

    useEffect(() => {
        fetchPhoto();
    }, [id]);

    const fetchPhoto = async () => {
        try {
            const res = await getAdminPhoto(id);
            setPhoto(res.data);
        } catch (error: any) {
            console.error('Error fetching photo:', error);
        } finally {
            setLoading(false);
        }
    };

    // Upload immediately when files are picked, so the "Selesai dan Buat Preview"
    // button only appears AFTER the photos are already stored in the system.
    const handleFilesSelected = async (e: any) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        (e.target as any).value = '';
        if (files.length === 0) return;

        setUploading(true);
        setProgress({ current: 0, total: files.length, success: 0, failed: 0 });

        let success = 0;
        let failed = 0;
        for (let i = 0; i < files.length; i++) {
            try {
                const formData = new FormData();
                formData.append('recaps', files[i]);
                await uploadRecaps(id, formData);
                success++;
            } catch (error: any) {
                console.error(`Error uploading file ${i + 1}:`, error);
                failed++;
            }
            setProgress({ current: i + 1, total: files.length, success, failed });
        }

        await fetchPhoto();
        setUploading(false);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProgress({ current: 0, total: 0, success: 0, failed: 0 });
    };

    const handleGeneratePreview = async () => {
        setGenerating(true);
        try {
            await generateVariantPreview(id);
            await fetchPhoto();
        } catch (error: any) {
            console.error('Error generating variant preview:', error);
            alert('Gagal membuat preview');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteExisting = async (recapId: any) => {
        if (confirm('Hapus recap foto ini?')) {
            try {
                await deleteRecap(recapId);
                fetchPhoto();
            } catch (error: any) {
                console.error('Error deleting recap:', error);
            }
        }
    };

    if (loading || !photo) {
        return (
            <AdminLayout title="Upload Recap">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    const variantCount = photo.recaps?.length || 0;

    return (
        <AdminLayout title={`Upload Recap #${photo.startNo || photo.start_no}`}>
            <Link
                to="/admin/recap"
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
                <ArrowLeft size={16} /> Kembali ke Daftar Recap
            </Link>

            {/* Preview Photo */}
            <div style={{
                background: '#0a0a0a',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'flex-start'
            }}>
                {(photo.variantPreviewUrl || (photo.url && !photo.url.includes('pending'))) && (
                    <img
                        src={photo.variantPreviewUrl || photo.url}
                        alt={`Start #${photo.startNo}`}
                        onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                        style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            background: '#111'
                        }}
                    />
                )}
                <div>
                    <p style={{ color: '#39FF14', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                        Foto Preview
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        #{photo.startNo || photo.start_no}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                        {variantCount} varian sudah diupload
                    </p>
                </div>
            </div>

            {/* Upload Area — uploads immediately on pick */}
            <div style={{
                background: '#0a0a0a',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '2rem'
            }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '900', textTransform: 'uppercase', color: '#39FF14', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                    <Upload size={16} /> Upload Foto Varian
                </h3>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFilesSelected}
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    style={{ display: 'none' }}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                        width: '100%',
                        padding: '2rem',
                        border: '2px dashed rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.4)',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: uploading ? '1.5rem' : 0
                    }}
                >
                    <Plus size={32} />
                    <span>{uploading ? 'Mengupload...' : 'Klik untuk pilih foto (bisa multiple)'}</span>
                </button>

                {uploading && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(57,255,20,0.1)',
                        border: '1px solid rgba(57,255,20,0.3)',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{
                                width: '20px', height: '20px',
                                border: '3px solid rgba(57,255,20,0.3)',
                                borderTopColor: '#39FF14',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <span style={{ color: '#39FF14', fontWeight: '700', fontSize: '0.875rem' }}>
                                Mengupload foto {progress.current + 1} dari {progress.total} ({progress.total > 0 ? Math.round(((progress.current + 1) / progress.total) * 100) : 0}%)
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                                height: '100%',
                                background: progress.failed > 0 ? 'linear-gradient(90deg, #39FF14, #f59e0b)' : '#39FF14',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                                <BarChart3 size={12} /> {progress.current}/{progress.total} ({progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%)
                            </span>
                            <span style={{ color: '#39FF14' }}>
                                <CheckCircle2 size={12} /> {progress.success} berhasil
                            </span>
                            {progress.failed > 0 && (
                                <span style={{ color: '#f87171' }}>
                                    <X size={12} /> {progress.failed} gagal
                                </span>
                            )}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', margin: 0 }}>
                            Mohon tunggu, jangan tutup halaman ini
                        </p>
                    </div>
                )}

                {!uploading && progress.total > 0 && progress.current === progress.total && (
                    <p style={{ marginTop: '1rem', color: '#39FF14', fontSize: '0.8rem', textAlign: 'center' }}>
                        <CheckCircle2 size={14} /> {progress.success} foto berhasil diupload
                    </p>
                )}
            </div>

            {/* Step 2 — only available AFTER variants are uploaded */}
            {!uploading && variantCount > 0 && (
                <div style={{
                    background: '#0a0a0a',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid rgba(57,255,20,0.2)',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '900', textTransform: 'uppercase', color: '#39FF14', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        <ImageIcon size={16} /> Preview Otomatis (dari varian)
                    </h3>

                    {photo.variantPreviewUrl ? (
                        <>
                            <img
                                src={photo.variantPreviewUrl}
                                alt="Preview otomatis"
                                style={{ width: '100%', maxWidth: '600px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <button
                                onClick={handleGeneratePreview}
                                disabled={generating}
                                style={{
                                    marginTop: '1rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'transparent',
                                    color: '#39FF14',
                                    border: '2px solid #39FF14',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '12px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    cursor: generating ? 'not-allowed' : 'pointer',
                                    opacity: generating ? 0.5 : 1
                                }}
                            >
                                {generating ? (<><Hourglass size={16} /> Membuat...</>) : (<><Sparkles size={16} /> Perbarui Preview</>)}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleGeneratePreview}
                            disabled={generating}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                background: '#39FF14',
                                color: 'black',
                                padding: '1rem',
                                borderRadius: '12px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                fontStyle: 'italic',
                                border: 'none',
                                cursor: generating ? 'not-allowed' : 'pointer',
                                opacity: generating ? 0.5 : 1
                            }}
                        >
                            {generating ? (<><Hourglass size={16} /> Membuat Preview...</>) : (<><Sparkles size={16} /> Selesai dan Buat Preview</>)}
                        </button>
                    )}
                </div>
            )}

            {/* Existing Recaps */}
            {variantCount > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        Varian Tersimpan ({variantCount})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                        {photo.recaps.map((recap: any, index: number) => {
                            const variantNumber = recap.variant_number || index + 1;
                            const recapUrl = recap.url && recap.url.startsWith('http')
                                ? recap.url
                                : `${import.meta.env.VITE_API_URL || ''}/uploads/recaps/${recap.file_path}`;
                            return (
                                <div key={recap.id} style={{ position: 'relative' }}>
                                    <img
                                        src={recapUrl}
                                        onError={(e) => { (e.target as HTMLInputElement).src = '/placeholder.jpg'; }}
                                        alt={`Varian ${variantNumber}`}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1/1',
                                            objectFit: 'cover',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute', top: '0.5rem', left: '0.5rem',
                                        background: '#39FF14', color: 'black',
                                        fontSize: '0.75rem', fontWeight: '900',
                                        padding: '0.25rem 0.5rem', borderRadius: '4px'
                                    }}>
                                        Varian {variantNumber}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteExisting(recap.id)}
                                        style={{
                                            position: 'absolute', top: '0.5rem', right: '0.5rem',
                                            background: 'rgba(239,68,68,0.8)', border: 'none',
                                            color: 'white', padding: '0.25rem',
                                            borderRadius: '4px', cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
