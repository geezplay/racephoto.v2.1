import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getAdminPhoto, uploadPhoto, updatePhoto, getAdminEvents, getAdminEvent, uploadRecaps, deleteRecap } from '../../services/api';
import { AlertTriangle, ArrowLeft, Camera, Calendar, Flag, Hash, Wallet, Image as ImageIcon, Hourglass, Save, Upload, CheckCircle2, BarChart3, Check, X, Lightbulb } from 'lucide-react';

export default function PhotoForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [formData, setFormData] = useState<any>({
        event_id: '',
        class_name: '',
        start_no: '',
        price: '',
        image: null
    });
    const [preview, setPreview] = useState<any>(null);

    // Recap photos state
    const [recaps, setRecaps] = useState<any[]>([]);
    const [recapFiles, setRecapFiles] = useState<any[]>([]);
    const [uploadingRecaps, setUploadingRecaps] = useState(false);

    // Custom confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<any>({ show: false, message: '', onConfirm: null });

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchEvents();
        if (isEdit) {
            fetchPhoto();
        }
    }, [id]);

    // Load classes when event changes
    useEffect(() => {
        if (formData.event_id) {
            fetchEventClasses(formData.event_id);
        } else {
            setClasses([]);
        }
    }, [formData.event_id]);

    const fetchEvents = async () => {
        try {
            const res = await getAdminEvents();
            setEvents(res.data);
        } catch (error: any) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchEventClasses = async (eventId: any) => {
        try {
            const res = await getAdminEvent(eventId);
            if (res.data.classes) {
                setClasses(res.data.classes);
            } else {
                setClasses([]);
            }
        } catch (error: any) {
            console.error('Error fetching event classes:', error);
            setClasses([]);
        }
    };

    const fetchPhoto = async () => {
        setLoading(true);
        try {
            const res = await getAdminPhoto(id);
            const photo = res.data;
            setFormData({
                event_id: photo.event_id || '',
                class_name: photo.class || '',
                start_no: photo.start_no || photo.startNo || '',
                price: photo.price || '',
                image: null
            });
            if (photo.photoUrl || photo.url) {
                setPreview(photo.photoUrl || photo.url);
            }
            // Load existing recaps - prepend API URL to relative paths
            if (photo.recaps) {
                const API_URL = import.meta.env.VITE_API_URL || '';
                setRecaps(photo.recaps.map((r: any) => ({
                    ...r,
                    url: r.url && r.url.startsWith('/') ? `${API_URL}${r.url}` : r.url
                })));
            }
        } catch (error: any) {
            console.error('Error fetching photo:', error);
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
            data.append('eventId', formData.event_id);
            data.append('class', formData.class_name);
            data.append('startNo', formData.start_no);
            data.append('price', formData.price);
            if (formData.image) {
                data.append('photo', formData.image);
            }

            if (isEdit) {
                await updatePhoto(id, data);
            } else {
                await uploadPhoto(data);
            }
            navigate('/admin');
        } catch (error: any) {
            console.error('Error saving photo:', error);
            alert('Gagal menyimpan foto');
        } finally {
            setSaving(false);
        }
    };

    // Recap handlers
    const [uploadProgress, setUploadProgress] = useState<any>({ current: 0, total: 0, success: 0, failed: 0 });

    const handleRecapFilesChange = (e: any) => {
        const files = Array.from((e.target as HTMLInputElement).files!);
        setRecapFiles(files);
        // Auto-start upload when files are selected
        if (files.length > 0 && id) {
            handleUploadRecapsSequential(files);
        }
    };

    const handleUploadRecapsSequential = async (files: any) => {
        if (files.length === 0 || !id) return;
        setUploadingRecaps(true);
        setUploadProgress({ current: 0, total: files.length, success: 0, failed: 0 });

        let successCount = 0;
        let failedCount = 0;

        // Upload files one by one for real-time progress
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                const formData = new FormData();
                formData.append('recaps', file);

                const res = await uploadRecaps(id, formData);

                successCount++;
                setUploadProgress({ current: i + 1, total: files.length, success: successCount, failed: failedCount });

                // Add the newly uploaded recap to the list
                if (res.data && Array.isArray(res.data)) {
                    const newRecapsWithUrl = res.data.map(r => ({
                        id: r.id,
                        variant_number: r.variant_number,
                        url: `${import.meta.env.VITE_API_URL}/uploads/recaps/${r.file_path}`
                    }));
                    setRecaps((prev: any) => [...prev, ...newRecapsWithUrl]);
                }
            } catch (error: any) {
                console.error(`Error uploading file ${i + 1} (${file.name}):`, error);
                failedCount++;
                setUploadProgress({ current: i + 1, total: files.length, success: successCount, failed: failedCount });
            }
        }

        setRecapFiles([]);
        // Show final result briefly before clearing
        await new Promise(resolve => setTimeout(resolve, 1500));
        setUploadProgress({ current: 0, total: 0, success: 0, failed: 0 });
        const fileInput = document.getElementById('recap-files');
        if (fileInput) (fileInput as any).value = '';
        setUploadingRecaps(false);
    };

    const handleUploadRecaps = async () => {
        if (recapFiles.length === 0 || !id) return;
        await handleUploadRecapsSequential(recapFiles);
    };

    const handleDeleteRecap = (recapId: any) => {
        setConfirmDialog({
            show: true,
            message: 'Hapus varian foto ini?',
            onConfirm: async () => {
                try {
                    await deleteRecap(recapId);
                    setRecaps(recaps.filter(r => r.id !== recapId));
                } catch (error: any) {
                    console.error('Error deleting recap:', error);
                }
                setConfirmDialog({ show: false, message: '', onConfirm: null });
            }
        });
    };

    // Custom Confirm Dialog Component
    const ConfirmModal = () => {
        if (!confirmDialog.show) return null;
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(4px)'
            }}>
                <div style={{
                    background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
                    border: '1px solid rgba(57,255,20,0.3)',
                    borderRadius: '16px',
                    padding: '2rem',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(57,255,20,0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <AlertTriangle size={24} color="#f59e0b" />
                        <h3 style={{
                            color: 'white',
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: '600'
                        }}>Konfirmasi</h3>
                    </div>
                    <p style={{
                        color: 'rgba(255,255,255,0.8)',
                        marginBottom: '2rem',
                        fontSize: '1rem',
                        lineHeight: '1.5'
                    }}>{confirmDialog.message}</p>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            onClick={() => setConfirmDialog({ show: false, message: '', onConfirm: null })}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >Batal</button>
                        <button
                            onClick={confirmDialog.onConfirm}
                            style={{
                                background: 'linear-gradient(135deg, #ff4757 0%, #ff3838 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                boxShadow: '0 4px 15px rgba(255,71,87,0.3)'
                            }}
                        >Hapus</button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <AdminLayout title={isEdit ? 'Edit Foto' : 'Upload Foto'}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={isEdit ? 'Edit Foto' : 'Upload Foto Baru'} subtitle="Kelola katalog foto">
            <div style={{ maxWidth: '1000px' }}>
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

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : (isEdit ? '1fr 1fr' : '1fr'),
                    gap: isMobile ? '1rem' : '2rem'
                }}>
                    {/* Photo Form */}
                    <form onSubmit={handleSubmit} style={{
                        background: '#0a0a0a',
                        padding: isMobile ? '1rem' : '2rem',
                        borderRadius: isMobile ? '16px' : '24px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            marginBottom: '1.5rem',
                            color: '#39FF14'
                        }}>
                            <Camera size={18} /> Detail Foto
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Event */}
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
                                    <Calendar size={12} /> Event
                                </label>
                                <select
                                    name="event_id"
                                    value={formData.event_id}
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
                                >
                                    <option value="">Pilih Event...</option>
                                    {events.map(event => (
                                        <option key={event.id || event._id} value={event.id || event._id}>{event.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Name */}
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
                                    <Flag size={12} /> Kelas Balap
                                </label>
                                {classes.length > 0 ? (
                                    <select
                                        name="class_name"
                                        value={formData.class_name}
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
                                    >
                                        <option value="">Pilih Kelas...</option>
                                        {classes.map(cls => (
                                            <option key={cls.id || cls._id} value={cls.name}>{cls.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        name="class_name"
                                        value={formData.class_name}
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
                                        placeholder="Contoh: MotoGP, Superbike"
                                    />
                                )}
                            </div>

                            {/* Start No */}
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
                                    <Hash size={12} /> Nomor Start
                                </label>
                                <input
                                    type="text"
                                    name="start_no"
                                    value={formData.start_no}
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
                                    placeholder="46, 93, etc."
                                />
                            </div>

                            {/* Price */}
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
                                    <Wallet size={12} /> Harga (Rp)
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
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
                                    placeholder="50000"
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
                                    <ImageIcon size={12} /> Foto Utama
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    required={!isEdit}
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
                                {saving ? (<><Hourglass size={16} /> Menyimpan...</>) : isEdit ? (<><Save size={16} /> Update Foto</>) : (<><Upload size={16} /> Upload Foto</>)}
                            </button>
                        </div>
                    </form>

                    {/* Recap Photos Section - Only show when editing */}
                    {isEdit && (
                        <div style={{
                            background: '#0a0a0a',
                            padding: isMobile ? '1rem' : '2rem',
                            borderRadius: isMobile ? '16px' : '24px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <h3 style={{
                                fontSize: '1rem',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                marginBottom: '1.5rem',
                                color: '#39FF14'
                            }}>
                                <Camera size={18} /> Varian Foto / Recap
                            </h3>

                            {/* Upload Recaps */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    fontWeight: '900',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.1em',
                                    marginBottom: '0.5rem'
                                }}>
                                    Upload Varian Baru (Multiple)
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row' }}>
                                    <input
                                        id="recap-files"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleRecapFilesChange}
                                        disabled={uploadingRecaps}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(0,0,0,0.5)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            padding: '0.75rem',
                                            color: 'white',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleUploadRecaps}
                                        disabled={uploadingRecaps || recapFiles.length === 0}
                                        style={{
                                            background: uploadingRecaps ? 'rgba(57,255,20,0.3)' : '#39FF14',
                                            color: uploadingRecaps ? '#39FF14' : 'black',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '8px',
                                            border: uploadingRecaps ? '1px solid #39FF14' : 'none',
                                            fontWeight: '700',
                                            cursor: uploadingRecaps || recapFiles.length === 0 ? 'not-allowed' : 'pointer',
                                            opacity: recapFiles.length === 0 && !uploadingRecaps ? 0.5 : 1,
                                            whiteSpace: 'nowrap',
                                            minWidth: isMobile ? '100%' : '120px'
                                        }}
                                    >
                                        {uploadingRecaps ? (<><Hourglass size={14} /> Uploading...</>) : (<><Upload size={14} /> Upload ({recapFiles.length})</>)}
                                    </button>
                                </div>

                                {/* Upload Progress Indicator */}
                                {uploadingRecaps && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '1rem',
                                        background: 'rgba(57,255,20,0.1)',
                                        border: '1px solid rgba(57,255,20,0.3)',
                                        borderRadius: '12px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.75rem',
                                            marginBottom: '0.75rem'
                                        }}>
                                            {uploadProgress.current < uploadProgress.total ? (
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    border: '3px solid rgba(57,255,20,0.3)',
                                                    borderTopColor: '#39FF14',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite'
                                                }} />
                                            ) : (
                                                <CheckCircle2 size={20} color="#39FF14" />
                                            )}
                                            <span style={{
                                                color: '#39FF14',
                                                fontWeight: '700',
                                                fontSize: '0.875rem'
                                            }}>
                                                {uploadProgress.current < uploadProgress.total
                                                    ? `Mengupload foto ${uploadProgress.current + 1} dari ${uploadProgress.total}`
                                                    : `Selesai! ${uploadProgress.success} berhasil`
                                                }
                                            </span>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%`,
                                                height: '100%',
                                                background: uploadProgress.failed > 0
                                                    ? 'linear-gradient(90deg, #39FF14, #f59e0b)'
                                                    : '#39FF14',
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        {/* Stats row */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '1.5rem',
                                            fontSize: '0.7rem',
                                            marginBottom: '0.25rem'
                                        }}>
                                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                                                <BarChart3 size={12} /> {uploadProgress.current}/{uploadProgress.total} ({uploadProgress.total > 0 ? Math.round((uploadProgress.current / uploadProgress.total) * 100) : 0}%)
                                            </span>
                                            <span style={{ color: '#39FF14' }}>
                                                <Check size={12} /> {uploadProgress.success} berhasil
                                            </span>
                                            {uploadProgress.failed > 0 && (
                                                <span style={{ color: '#f87171' }}>
                                                    <X size={12} /> {uploadProgress.failed} gagal
                                                </span>
                                            )}
                                        </div>
                                        {uploadProgress.current < uploadProgress.total && (
                                            <p style={{
                                                color: 'rgba(255,255,255,0.4)',
                                                fontSize: '0.7rem',
                                                margin: 0
                                            }}>
                                                Mohon tunggu, jangan tutup halaman ini
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Existing Recaps */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    fontWeight: '900',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.1em',
                                    marginBottom: '0.75rem'
                                }}>
                                    Varian Tersimpan ({recaps.length})
                                </label>

                                {recaps.length === 0 ? (
                                    <div style={{
                                        padding: '2rem',
                                        textAlign: 'center',
                                        color: 'rgba(255,255,255,0.3)',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '12px'
                                    }}>
                                        <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}><Camera size={32} /></div>
                                        <p style={{ fontSize: '0.875rem' }}>Belum ada varian foto</p>
                                        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Upload varian untuk ditampilkan di recap</p>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                        gap: '0.5rem',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        padding: '0.5rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '12px'
                                    }}>
                                        {recaps.map((recap, index) => (
                                            <div
                                                key={recap.id}
                                                style={{
                                                    position: 'relative',
                                                    aspectRatio: '1',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                <img
                                                    src={recap.url}
                                                    alt={`Varian ${index + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                    onError={(e) => { (e.target as HTMLInputElement).src = '/placeholder.jpg'; }}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                                    padding: '0.5rem 0.25rem 0.25rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{ fontSize: '0.625rem', color: 'white', fontWeight: '700' }}>
                                                        #{recap.variant_number || index + 1}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteRecap(recap.id)}
                                                        style={{
                                                            background: 'rgba(239,68,68,0.8)',
                                                            border: 'none',
                                                            padding: '0.125rem 0.25rem',
                                                            borderRadius: '2px',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '0.5rem'
                                                        }}
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <p style={{
                                marginTop: '1rem',
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.3)',
                                fontStyle: 'italic'
                            }}>
                                <Lightbulb size={12} /> Varian foto akan ditampilkan saat pembeli melihat detail foto ini
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmModal />
        </AdminLayout>
    );
}
