import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getPhotographers, createPhotographer, updatePhotographer, deletePhotographer } from '../../services/api';
import { Camera, Plus, Pencil, Trash2, Save, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Toast notification component
function Toast({ message, type, onClose }: { message: any; type?: any; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success'
        ? 'linear-gradient(135deg, rgba(57,255,20,0.15), rgba(57,255,20,0.05))'
        : 'linear-gradient(135deg, rgba(255,60,60,0.15), rgba(255,60,60,0.05))';
    const borderColor = type === 'success' ? 'rgba(57,255,20,0.4)' : 'rgba(255,60,60,0.4)';
    const iconColor = type === 'success' ? '#39FF14' : '#FF3C3C';

    return (
        <div style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            background: bgColor,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            minWidth: '280px',
            maxWidth: '420px',
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${type === 'success' ? 'rgba(57,255,20,0.1)' : 'rgba(255,60,60,0.1)'}`,
            animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {type === 'success'
                ? <CheckCircle size={20} color={iconColor} />
                : <AlertCircle size={20} color={iconColor} />
            }
            <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', flex: 1 }}>{message}</span>
            <button onClick={onClose} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', padding: '2px', display: 'flex'
            }}>
                <X size={16} />
            </button>
            <style>{`
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// Confirm Delete Modal
function ConfirmModal({ message, onConfirm, onCancel }: { message: any; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e, #0d0d1a)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Trash2 size={18} color="#FF3C3C" />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', margin: 0 }}>Konfirmasi Hapus</h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{
                        background: 'rgba(255,255,255,0.08)', color: 'white',
                        padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: '700',
                        border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                        fontSize: '0.85rem', transition: 'all 0.2s'
                    }}>Batal</button>
                    <button onClick={onConfirm} style={{
                        background: 'linear-gradient(135deg, #FF3C3C, #CC0000)',
                        color: 'white', padding: '0.6rem 1.25rem', borderRadius: '10px',
                        fontWeight: '700', border: 'none', cursor: 'pointer',
                        fontSize: '0.85rem', transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(255,60,60,0.3)'
                    }}>Hapus</button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}

export default function PhotographerManagement() {
    const [photographers, setPhotographers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<any>(null);
    const [editPhotoUrl, setEditPhotoUrl] = useState<any>(null);
    const fileRef = useRef<any>(null);
    const [formData, setFormData] = useState<any>({
        name: '',
        category: '',
        team: '',
        gradient_from: '#39FF14',
        gradient_to: '#00D4FF',
        photo: null
    });

    useEffect(() => {
        fetchPhotographers();
    }, []);

    const showToast = (message: any, type = 'success') => {
        setToast({ message, type });
    };

    const fetchPhotographers = async () => {
        try {
            const res = await getPhotographers();
            setPhotographers(res.data);
        } catch (error: any) {
            console.error('Error fetching photographers:', error);
            showToast('Gagal memuat data fotografer', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('category', formData.category);
            data.append('team', formData.team);
            data.append('gradient_from', formData.gradient_from);
            data.append('gradient_to', formData.gradient_to);
            if (formData.photo) {
                data.append('photo', formData.photo);
            }

            if (editingId) {
                await updatePhotographer(editingId, data);
                showToast('Fotografer berhasil diperbarui');
            } else {
                await createPhotographer(data);
                showToast('Fotografer berhasil ditambahkan');
            }
            fetchPhotographers();
            resetForm();
        } catch (error: any) {
            console.error('Error saving photographer:', error);
            showToast(error.response?.data?.message || 'Gagal menyimpan fotografer', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (photographer: any) => {
        setEditingId(photographer.id);
        setEditPhotoUrl(photographer.photoUrl || photographer.photo || null);
        setFormData({
            name: photographer.name,
            category: photographer.category || '',
            team: photographer.team || '',
            gradient_from: photographer.gradient_from || photographer.gradientFrom || '#39FF14',
            gradient_to: photographer.gradient_to || photographer.gradientTo || '#00D4FF',
            photo: null
        });
        setShowForm(true);
    };

    const handleDelete = async (id: any) => {
        try {
            await deletePhotographer(id);
            showToast('Fotografer berhasil dihapus');
            fetchPhotographers();
        } catch (error: any) {
            console.error('Error deleting photographer:', error);
            showToast('Gagal menghapus fotografer', 'error');
        }
        setConfirmDelete(null);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setEditPhotoUrl(null);
        if (fileRef.current) fileRef.current.value = '';
        setFormData({ name: '', category: '', team: '', gradient_from: '#39FF14', gradient_to: '#00D4FF', photo: null });
    };

    // Label style
    const labelStyle = {
        display: 'block', fontSize: '10px', textTransform: 'uppercase',
        fontWeight: '900', color: '#39FF14', marginBottom: '0.5rem',
        letterSpacing: '0.5px'
    };

    // Input style
    const inputStyle = {
        width: '100%', background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
        padding: '0.75rem 1rem', color: 'white', boxSizing: 'border-box' as const,
        fontSize: '0.9rem', transition: 'border-color 0.2s',
        outline: 'none'
    };

    if (loading) {
        return (
            <AdminLayout title="Fotografer">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Loader2 size={32} color="#39FF14" style={{ animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Kelola Fotografer" subtitle="Tambah dan kelola fotografer">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <ConfirmModal
                    message={`Apakah Anda yakin ingin menghapus fotografer "${confirmDelete.name}"? Tindakan ini tidak dapat dibatalkan.`}
                    onConfirm={() => handleDelete(confirmDelete.id)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', margin: 0 }}>
                    Daftar Fotografer ({photographers.length})
                </h3>
                <button
                    onClick={() => { if (showForm && editingId) resetForm(); else setShowForm(!showForm); }}
                    style={{
                        background: showForm ? 'rgba(255,255,255,0.1)' : '#39FF14',
                        color: showForm ? 'white' : 'black',
                        padding: '0.6rem 1.25rem', borderRadius: '10px',
                        fontSize: '0.8rem', fontWeight: '900', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        transition: 'all 0.2s'
                    }}
                >
                    {showForm ? <><X size={16} /> TUTUP</> : <><Plus size={16} /> TAMBAH FOTOGRAFER</>}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={{
                    background: 'linear-gradient(135deg, rgba(10,10,10,0.9), rgba(20,20,40,0.9))',
                    padding: '1.5rem', borderRadius: '16px',
                    border: '1px solid rgba(57,255,20,0.1)',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                    <h4 style={{
                        fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase',
                        color: '#39FF14', marginBottom: '1.25rem', display: 'flex',
                        alignItems: 'center', gap: '0.5rem'
                    }}>
                        {editingId ? <><Pencil size={14} /> Edit Fotografer</> : <><Plus size={14} /> Tambah Fotografer Baru</>}
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Nama *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: (e.target as any).value })}
                                required
                                placeholder="Nama fotografer"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Kategori</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: (e.target as any).value })}
                                placeholder="Road Race, MotoGP, etc."
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Team</label>
                            <input
                                type="text"
                                value={formData.team}
                                onChange={(e) => setFormData({ ...formData, team: (e.target as any).value })}
                                placeholder="Nama tim"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Gradient From</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={formData.gradient_from}
                                    onChange={(e) => setFormData({ ...formData, gradient_from: (e.target as any).value })}
                                    style={{
                                        width: '48px', height: '40px', background: 'transparent',
                                        border: '2px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                                        cursor: 'pointer', padding: '2px'
                                    }}
                                />
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                    {formData.gradient_from}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Gradient To</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={formData.gradient_to}
                                    onChange={(e) => setFormData({ ...formData, gradient_to: (e.target as any).value })}
                                    style={{
                                        width: '48px', height: '40px', background: 'transparent',
                                        border: '2px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                                        cursor: 'pointer', padding: '2px'
                                    }}
                                />
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                    {formData.gradient_to}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>
                                Foto {editingId && editPhotoUrl ? '(kosongkan jika tidak ingin ganti)' : ''}
                            </label>
                            {editingId && editPhotoUrl && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <img
                                        src={editPhotoUrl}
                                        alt="Current"
                                        style={{
                                            width: '48px', height: '48px', borderRadius: '50%',
                                            objectFit: 'cover', border: '2px solid rgba(57,255,20,0.3)'
                                        }}
                                    />
                                </div>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, photo: (e.target as HTMLInputElement).files![0] })}
                                style={{
                                    width: '100%', background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                                    padding: '0.5rem', color: 'white', boxSizing: 'border-box' as const,
                                    fontSize: '0.85rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Preview gradient */}
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', color: 'rgba(255,255,255,0.4)' }}>Preview:</span>
                        <div style={{
                            width: '120px', height: '6px', borderRadius: '3px',
                            background: `linear-gradient(90deg, ${formData.gradient_from}, ${formData.gradient_to})`
                        }} />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <button type="submit" disabled={submitting} style={{
                            background: submitting ? 'rgba(57,255,20,0.5)' : '#39FF14',
                            color: 'black', padding: '0.6rem 1.25rem', borderRadius: '10px',
                            fontWeight: '800', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '0.85rem', transition: 'all 0.2s'
                        }}>
                            {submitting ? (
                                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
                            ) : editingId ? (
                                <><Save size={16} /> Update</>
                            ) : (
                                <><Plus size={16} /> Tambah</>
                            )}
                        </button>
                        <button type="button" onClick={resetForm} style={{
                            background: 'rgba(255,255,255,0.08)', color: 'white',
                            padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: '700',
                            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                            fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}>
                            <X size={16} /> Batal
                        </button>
                    </div>
                </form>
            )}

            {/* Photographer Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {photographers.map(photographer => (
                    <div key={photographer.id} style={{
                        background: `linear-gradient(135deg, ${photographer.gradient_from || photographer.gradientFrom || '#39FF14'}15, ${photographer.gradient_to || photographer.gradientTo || '#00D4FF'}15)`,
                        padding: '1.5rem', borderRadius: '16px',
                        border: `1px solid ${photographer.gradient_from || photographer.gradientFrom || '#39FF14'}25`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                    }}>
                        {/* Gradient accent bar */}
                        <div style={{
                            position: 'absolute', top: 0, left: '20%', right: '20%', height: '3px',
                            background: `linear-gradient(90deg, ${photographer.gradient_from || '#39FF14'}, ${photographer.gradient_to || '#00D4FF'})`,
                            borderRadius: '0 0 3px 3px'
                        }} />

                        {photographer.photoUrl || photographer.photo ? (
                            <img
                                src={photographer.photoUrl || photographer.photo}
                                alt={photographer.name}
                                style={{
                                    width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%',
                                    border: `3px solid ${photographer.gradient_from || '#39FF14'}40`
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '80px', height: '80px',
                                background: `linear-gradient(135deg, ${photographer.gradient_from || '#39FF14'}, ${photographer.gradient_to || '#00D4FF'})`,
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Camera size={28} color="white" />
                            </div>
                        )}
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: '900', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{photographer.name}</p>
                            {photographer.category && (
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                                    {photographer.category}
                                </span>
                            )}
                            {photographer.team && (
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: '2px' }}>
                                    {photographer.team}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEdit(photographer)} style={{
                                padding: '0.5rem 0.75rem', background: 'rgba(57,255,20,0.1)',
                                borderRadius: '8px', border: '1px solid rgba(57,255,20,0.2)',
                                color: '#39FF14', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem',
                                fontWeight: '700', transition: 'all 0.2s'
                            }}>
                                <Pencil size={14} /> Edit
                            </button>
                            <button onClick={() => setConfirmDelete(photographer)} style={{
                                padding: '0.5rem 0.75rem', background: 'rgba(255,60,60,0.1)',
                                borderRadius: '8px', border: '1px solid rgba(255,60,60,0.2)',
                                color: '#FF3C3C', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem',
                                fontWeight: '700', transition: 'all 0.2s'
                            }}>
                                <Trash2 size={14} /> Hapus
                            </button>
                        </div>
                    </div>
                ))}
                {photographers.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1', background: 'rgba(10,10,10,0.5)',
                        padding: '3rem', borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center'
                    }}>
                        <Camera size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: '0.75rem' }} />
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Belum ada fotografer</p>
                        <button onClick={() => setShowForm(true)} style={{
                            marginTop: '1rem', background: 'rgba(57,255,20,0.1)',
                            border: '1px solid rgba(57,255,20,0.3)', borderRadius: '10px',
                            padding: '0.5rem 1rem', color: '#39FF14', cursor: 'pointer',
                            fontWeight: '700', fontSize: '0.8rem'
                        }}>
                            <Plus size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> Tambah Fotografer Pertama
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
