import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getSettings, updateSettings } from '../../services/api';
import { Tag, MessageCircle, Mail, Smartphone, Image as ImageIcon, Hourglass, Save } from 'lucide-react';

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<any>({
        site_name: 'RacePhoto',
        tagline: 'Professional Motorsport Photography',
        contact_email: '',
        contact_phone: '',
        logo: null
    });
    const [preview, setPreview] = useState<any>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await getSettings();
            if (res.data) {
                setFormData({
                    site_name: res.data.site_name || 'RacePhoto',
                    tagline: res.data.tagline || '',
                    contact_email: res.data.contact_email || '',
                    contact_phone: res.data.contact_phone || '',
                    logo: null
                });
                if (res.data.logo_url) {
                    setPreview(res.data.logo_url);
                }
            }
        } catch (error: any) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append('site_name', formData.site_name);
            data.append('tagline', formData.tagline);
            data.append('contact_email', formData.contact_email);
            data.append('contact_phone', formData.contact_phone);
            if (formData.logo) {
                data.append('logo', formData.logo);
            }
            await updateSettings(data);
            alert('Pengaturan berhasil disimpan!');
        } catch (error: any) {
            console.error('Error saving settings:', error);
            alert('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = (e: any) => {
        const file = (e.target as HTMLInputElement).files![0];
        if (file) {
            setFormData({ ...formData, logo: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Pengaturan">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Pengaturan" subtitle="Kelola pengaturan website">
            <div style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit} style={{
                    background: '#0a0a0a',
                    padding: '2rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Site Name */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: '900',
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '0.5rem'
                            }}>
                                <Tag size={12} /> Nama Website
                            </label>
                            <input
                                type="text"
                                value={formData.site_name}
                                onChange={(e) => setFormData({ ...formData, site_name: (e.target as any).value })}
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

                        {/* Tagline */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: '900',
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '0.5rem'
                            }}>
                                <MessageCircle size={12} /> Tagline
                            </label>
                            <input
                                type="text"
                                value={formData.tagline}
                                onChange={(e) => setFormData({ ...formData, tagline: (e.target as any).value })}
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

                        {/* Contact Email */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: '900',
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '0.5rem'
                            }}>
                                <Mail size={12} /> Email Kontak
                            </label>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: (e.target as any).value })}
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

                        {/* Contact Phone */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: '900',
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '0.5rem'
                            }}>
                                <Smartphone size={12} /> Telepon Kontak
                            </label>
                            <input
                                type="text"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: (e.target as any).value })}
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

                        {/* Logo */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: '900',
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '0.5rem'
                            }}>
                                <ImageIcon size={12} /> Logo Website
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
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
                                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                    <img
                                        src={preview}
                                        alt="Logo Preview"
                                        style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
                                    />
                                </div>
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
                            {saving ? (<><Hourglass size={16} /> Menyimpan...</>) : (<><Save size={16} /> Simpan Pengaturan</>)}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
