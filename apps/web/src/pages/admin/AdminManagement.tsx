import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../services/api';
import { Plus, Save, Pencil, Trash2, User } from 'lucide-react';

export default function AdminManagement() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<any>(null);
    const [formData, setFormData] = useState<any>({
        name: '',
        email: '',
        password: '',
        role: 'admin'
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await getAdmins();
            setAdmins(res.data);
        } catch (error: any) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (editingId) {
                const data: any = { name: formData.name, email: formData.email, role: formData.role };
                if (formData.password) data.password = formData.password;
                await updateAdmin(editingId, data);
            } else {
                await createAdmin(formData);
            }
            fetchAdmins();
            resetForm();
        } catch (error: any) {
            console.error('Error saving admin:', error);
            alert('Gagal menyimpan admin');
        }
    };

    const handleEdit = (admin: any) => {
        setEditingId(admin.id);
        setFormData({
            name: admin.name,
            email: admin.email,
            password: '',
            role: admin.role
        });
        setShowForm(true);
    };

    const handleDelete = async (id: any) => {
        if (!confirm('Hapus admin ini?')) return;
        try {
            await deleteAdmin(id);
            fetchAdmins();
        } catch (error: any) {
            console.error('Error deleting admin:', error);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', email: '', password: '', role: 'admin' });
    };

    if (loading) {
        return (
            <AdminLayout title="Kelola Admin">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Kelola Admin" subtitle="Tambah dan kelola admin">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
                    Daftar Admin
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
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> TAMBAH ADMIN
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
                                Nama
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
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: (e.target as any).value })}
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
                                Password {editingId && '(kosongkan jika tidak diubah)'}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: (e.target as any).value })}
                                required={!editingId}
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
                                Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: (e.target as any).value })}
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
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
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

            {/* Admin Table */}
            <div style={{
                background: '#0a0a0a',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Nama</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Email</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Role</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(admin => (
                            <tr key={admin.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', fontWeight: '700' }}>{admin.name}</td>
                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.6)' }}>{admin.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        background: admin.role === 'super_admin' ? 'rgba(139,92,246,0.1)' : 'rgba(57,255,20,0.1)',
                                        color: admin.role === 'super_admin' ? '#8b5cf6' : '#39FF14'
                                    }}>
                                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(admin)} style={{
                                            padding: '0.5rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.6)',
                                            cursor: 'pointer'
                                        }}> <Pencil size={16} /></button>
                                        <button onClick={() => handleDelete(admin.id)} style={{
                                            padding: '0.5rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.6)',
                                            cursor: 'pointer'
                                        }}> <Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {admins.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                    <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}><User size={40} /></div>
                                    <p>Belum ada admin</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
