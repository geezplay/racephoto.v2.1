import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { getSponsors, createSponsor, updateSponsor, deleteSponsor } from '../../services/api';
import { Plus, Save, Building2, Pencil, Trash2 } from 'lucide-react';

export default function SponsorManagement() {
    const [sponsors, setSponsors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<any>(null);
    const [formData, setFormData] = useState<any>({
        name: '',
        category: 'sponsor',
        logo: null
    });

    useEffect(() => {
        fetchSponsors();
    }, []);

    const fetchSponsors = async () => {
        try {
            const res = await getSponsors();
            setSponsors(res.data);
        } catch (error: any) {
            console.error('Error fetching sponsors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('category', formData.category);
            if (formData.logo) {
                data.append('logo', formData.logo);
            }

            if (editingId) {
                await updateSponsor(editingId, data);
            } else {
                await createSponsor(data);
            }
            fetchSponsors();
            resetForm();
        } catch (error: any) {
            console.error('Error saving sponsor:', error);
        }
    };

    const handleEdit = (sponsor: any) => {
        setEditingId(sponsor.id);
        setFormData({
            name: sponsor.name,
            category: sponsor.category,
            logo: null
        });
        setShowForm(true);
    };

    const handleDelete = async (id: any) => {
        if (!confirm('Hapus sponsor ini?')) return;
        try {
            await deleteSponsor(id);
            fetchSponsors();
        } catch (error: any) {
            console.error('Error deleting sponsor:', error);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', category: 'sponsor', logo: null });
    };

    if (loading) {
        return (
            <AdminLayout title="Sponsor">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Kelola Sponsor" subtitle="Tambah dan kelola sponsor">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
                    Daftar Sponsor
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: '#39FF14',
                        color: 'black',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Plus size={16} /> TAMBAH SPONSOR
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={{
                    background: '#0a0a0a',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', color: '#39FF14', marginBottom: '0.5rem' }}>
                                Nama Sponsor
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: (e.target as any).value })}
                                required
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    color: 'white',
                                    boxSizing: 'border-box' as const
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', color: '#39FF14', marginBottom: '0.5rem' }}>
                                Kategori
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: (e.target as any).value })}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    color: 'white',
                                    boxSizing: 'border-box' as const
                                }}
                            >
                                <option value="development">Development By</option>
                                <option value="sponsor">Sponsor Utama</option>
                                <option value="media">Media Partner</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', color: '#39FF14', marginBottom: '0.5rem' }}>
                                Logo
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, logo: (e.target as HTMLInputElement).files![0] })}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                    color: 'white',
                                    boxSizing: 'border-box' as const
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="submit" style={{
                            background: '#39FF14',
                            color: 'black',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer'
                        }}>
                            {editingId ? (<><Save size={16} /> Update</>) : (<><Plus size={16} /> Tambah</>)}
                        </button>
                        <button type="button" onClick={resetForm} style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer'
                        }}>
                            Batal
                        </button>
                    </div>
                </form>
            )}

            {/* Sponsor Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {sponsors.map(sponsor => (
                    <div key={sponsor.id} style={{
                        background: '#0a0a0a',
                        padding: '1.5rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        {sponsor.logoUrl || sponsor.logo ? (
                            <img
                                src={sponsor.logoUrl || sponsor.logo}
                                alt={sponsor.name}
                                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                            />
                        ) : (
                            <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Building2 size={36} color="rgba(255,255,255,0.4)" />
                            </div>
                        )}
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: '900', marginBottom: '0.25rem' }}>{sponsor.name}</p>
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '9999px',
                                background: 'rgba(57,255,20,0.1)',
                                color: '#39FF14'
                            }}>
                                {sponsor.category}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEdit(sponsor)} style={{
                                padding: '0.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                border: 'none',
                                color: 'rgba(255,255,255,0.6)',
                                cursor: 'pointer'
                            }}><Pencil size={16} /></button>
                            <button onClick={() => handleDelete(sponsor.id)} style={{
                                padding: '0.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                border: 'none',
                                color: 'rgba(255,255,255,0.6)',
                                cursor: 'pointer'
                            }}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                {sponsors.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        background: '#0a0a0a',
                        padding: '3rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '0.5rem', opacity: 0.2 }}><Building2 size={40} /></div>
                        <p style={{ color: 'rgba(255,255,255,0.3)' }}>Belum ada sponsor</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
