import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../../services/api';
import api from '../../services/api';
import { Tag, X, Plus, CheckCircle2, AlertTriangle, Check } from 'lucide-react';

export default function DiscountManager() {
    const [discounts, setDiscounts] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<any>(null);
    const [form, setForm] = useState<any>({
        code: '', discount_type: 'percent', discount_value: '',
        is_active: true, usage_limit: '', valid_until: '',
        max_photos: '', event_ids: []
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchDiscounts = useCallback(async () => {
        try {
            const res = await getDiscounts();
            setDiscounts(res.data);
        } catch (e: any) {
            console.error('Fetch discounts error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/events');
            const eventList = res.data.events || res.data || [];
            setEvents(eventList);
        } catch (e: any) {
            console.error('Fetch events error:', e);
        }
    }, []);

    useEffect(() => { fetchDiscounts(); fetchEvents(); }, [fetchDiscounts, fetchEvents]);

    const resetForm = () => {
        setForm({ code: '', discount_type: 'percent', discount_value: '', is_active: true, usage_limit: '', valid_until: '', max_photos: '', event_ids: [] });
        setEditId(null);
        setShowForm(false);
        setError('');
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const data = {
                ...form,
                code: form.code.toUpperCase().trim(),
                discount_value: parseInt(form.discount_value),
                usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
                valid_until: form.valid_until || null,
                max_photos: form.max_photos ? parseInt(form.max_photos) : null,
                event_ids: form.event_ids.length > 0 ? form.event_ids.map(Number) : null
            };
            if (editId) {
                await updateDiscount(editId, data);
                setSuccess('Diskon berhasil diupdate');
            } else {
                await createDiscount(data);
                setSuccess('Diskon berhasil ditambahkan');
            }
            resetForm();
            fetchDiscounts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal menyimpan diskon');
        }
    };

    const handleEdit = (d: any) => {
        const parsedEventIds = d.event_ids || [];
        setForm({
            code: d.code,
            discount_type: d.discount_type,
            discount_value: d.discount_value.toString(),
            is_active: d.is_active,
            usage_limit: d.usage_limit ? d.usage_limit.toString() : '',
            valid_until: d.valid_until ? d.valid_until.split('T')[0] : '',
            max_photos: d.max_photos ? d.max_photos.toString() : '',
            event_ids: parsedEventIds.map(String)
        });
        setEditId(d.id);
        setShowForm(true);
        setError('');
    };

    const handleDelete = async (id: any) => {
        if (!window.confirm('Hapus kode diskon ini?')) return;
        try {
            await deleteDiscount(id);
            fetchDiscounts();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal menghapus');
        }
    };

    const handleToggle = async (d: any) => {
        try {
            await updateDiscount(d.id, { is_active: !d.is_active });
            fetchDiscounts();
        } catch (err: any) {
            console.error('Toggle error:', err);
        }
    };

    const toggleEventId = (id: any) => {
        const sid = String(id);
        setForm((prev: any) => ({
            ...prev,
            event_ids: prev.event_ids.includes(sid)
                ? prev.event_ids.filter((e: any) => e !== sid)
                : [...prev.event_ids, sid]
        }));
    };

    const getEventName = (id: any) => {
        const ev = events.find(e => e.id === parseInt(id));
        return ev ? ev.name : `Event #${id}`;
    };

    const S = {
        card: { background: '#111', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' },
        input: {
            width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', padding: '0.75rem 1rem', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' as const
        },
        select: {
            width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', padding: '0.75rem 1rem', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' as const
        },
        label: { fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'block' },
        btn: (color = '#39FF14') => ({
            padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.8rem',
            border: 'none', cursor: 'pointer', background: color, color: color === '#39FF14' ? 'black' : 'white',
            textTransform: 'uppercase'
        }),
        eventChip: (selected: any) => ({
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600',
            cursor: 'pointer', transition: 'all 0.2s',
            background: selected ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.05)',
            border: selected ? '1px solid rgba(57,255,20,0.4)' : '1px solid rgba(255,255,255,0.1)',
            color: selected ? '#39FF14' : 'rgba(255,255,255,0.5)'
        })
    };

    if (loading) {
        return (
            <AdminLayout title="Kelola Diskon" subtitle="Kode diskon & promosi">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Memuat...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Kelola Diskon" subtitle="Kode diskon & promosi">
        <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', fontStyle: 'italic' }}>
                    <Tag size={18} /> Kelola Diskon
                </h2>
                <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={S.btn()}>
                    {showForm ? (<><X size={14} /> Tutup</>) : (<><Plus size={14} /> Tambah Diskon</>)}
                </button>
            </div>

            {success && (
                <div style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', color: '#39FF14', fontSize: '0.85rem', fontWeight: '600' }}>
                    <CheckCircle2 size={16} /> {success}
                </div>
            )}
            {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div style={{ ...S.card, marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#39FF14', marginBottom: '1rem' }}>
                        {editId ? 'Edit Diskon' : 'Tambah Diskon Baru'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={S.label}>Kode Diskon</label>
                                <input value={form.code} onChange={e => setForm({ ...form, code: (e.target as any).value })}
                                    placeholder="DISKON50" style={{ ...S.input, textTransform: 'uppercase' }} required />
                            </div>
                            <div>
                                <label style={S.label}>Tipe</label>
                                <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: (e.target as any).value })} style={S.select}>
                                    <option value="percent">Persentase (%)</option>
                                    <option value="flat">Potongan Tetap (Rp)</option>
                                </select>
                            </div>
                            <div>
                                <label style={S.label}>Nilai {form.discount_type === 'percent' ? '(%)' : '(Rp)'}</label>
                                <input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: (e.target as any).value })}
                                    placeholder={form.discount_type === 'percent' ? '50' : '10000'} style={S.input} required min="1" />
                            </div>
                            <div>
                                <label style={S.label}>Maks Foto Diskon</label>
                                <input type="number" value={form.max_photos} onChange={e => setForm({ ...form, max_photos: (e.target as any).value })}
                                    placeholder="Kosong = semua foto" style={S.input} min="1" />
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>Jumlah foto yang mendapat diskon</span>
                            </div>
                            <div>
                                <label style={S.label}>Batas Penggunaan</label>
                                <input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: (e.target as any).value })}
                                    placeholder="Kosong = unlimited" style={S.input} min="1" />
                            </div>
                            <div>
                                <label style={S.label}>Berlaku Sampai</label>
                                <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: (e.target as any).value })}
                                    style={S.input} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                                    <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600' }}>Aktif</span>
                                </label>
                            </div>
                        </div>

                        {/* Event Selector */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={S.label}>Berlaku untuk Event (Kosong = Semua Event)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                {events.length === 0 ? (
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Tidak ada event</span>
                                ) : (
                                    events.map(ev => (
                                        <span
                                            key={ev.id}
                                            onClick={() => toggleEventId(ev.id)}
                                            style={S.eventChip(form.event_ids.includes(String(ev.id)))}
                                        >
                                            {form.event_ids.includes(String(ev.id)) ? <Check size={16} /> : null}{ev.name}
                                        </span>
                                    ))
                                )}
                            </div>
                            {form.event_ids.length > 0 && (
                                <p style={{ fontSize: '0.7rem', color: '#39FF14', margin: '0.4rem 0 0', fontWeight: '600' }}>
                                    {form.event_ids.length} event dipilih
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="submit" style={S.btn()}>{editId ? 'Update' : 'Simpan'}</button>
                            <button type="button" onClick={resetForm} style={{ ...S.btn('rgba(255,255,255,0.1)'), color: 'white' }}>Batal</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div style={S.card}>
                {discounts.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem 0' }}>
                        Belum ada kode diskon.
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    {['Kode', 'Tipe', 'Nilai', 'Maks Foto', 'Event', 'Status', 'Pemakaian', 'Berlaku', 'Aksi'].map(h => (
                                        <th key={h} style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {discounts.map(d => {
                                    const evIds = d.event_ids || [];
                                    return (
                                        <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: '800', color: '#39FF14', fontFamily: 'monospace' }}>{d.code}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.6)' }}>{d.discount_type === 'percent' ? 'Persen' : 'Tetap'}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'white', fontWeight: '700' }}>
                                                {d.discount_type === 'percent' ? `${d.discount_value}%` : `Rp ${d.discount_value.toLocaleString()}`}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                                                {d.max_photos || '∞'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', maxWidth: '150px' }}>
                                                {evIds.length > 0
                                                    ? evIds.map((id: any) => getEventName(id)).join(', ')
                                                    : <span style={{ color: 'rgba(255,255,255,0.3)' }}>Semua</span>
                                                }
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <span onClick={() => handleToggle(d)} style={{
                                                    padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer',
                                                    background: d.is_active ? 'rgba(57,255,20,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: d.is_active ? '#39FF14' : '#ef4444'
                                                }}>
                                                    {d.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                                                {d.used_count}{d.usage_limit ? `/${d.usage_limit}` : '/∞'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                                {d.valid_until ? new Date(d.valid_until).toLocaleDateString('id-ID') : '∞'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button onClick={() => handleEdit(d)} style={{
                                                        background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                                                        borderRadius: '6px', padding: '0.3rem 0.6rem', color: '#3b82f6',
                                                        fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer'
                                                    }}>Edit</button>
                                                    <button onClick={() => handleDelete(d.id)} style={{
                                                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                                        borderRadius: '6px', padding: '0.3rem 0.6rem', color: '#ef4444',
                                                        fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer'
                                                    }}>Hapus</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
        </AdminLayout>
    );
}
