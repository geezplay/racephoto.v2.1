import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getWithdrawalRequests, approveWithdrawal, rejectWithdrawal } from '../../services/api';
import { Landmark, CheckCircle2, XCircle, Upload } from 'lucide-react';

export default function WithdrawalRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await getWithdrawalRequests();
            setRequests(res.data);
        } catch (error: any) {
            console.error('Error fetching withdrawal requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: any) => {
        try {
            await approveWithdrawal(id);
            fetchRequests();
        } catch (error: any) {
            console.error('Error approving withdrawal:', error);
        }
    };

    const handleReject = async (id: any) => {
        const reason = prompt('Alasan penolakan:');
        if (!reason) return;
        try {
            await rejectWithdrawal(id, reason);
            fetchRequests();
        } catch (error: any) {
            console.error('Error rejecting withdrawal:', error);
        }
    };

    const formatPrice = (price: any) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return (
            <AdminLayout title="Request Penarikan">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Request Penarikan" subtitle="Kelola permintaan penarikan admin">
            <div style={{
                background: '#0a0a0a',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Admin</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Jumlah</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Info Bank</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Tanggal</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(req => (
                            <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div>
                                        <p style={{ fontWeight: '700' }}>{req.admin?.name || req.user?.name || req.userId?.name || 'Admin'}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{req.admin?.email || req.user?.email || req.userId?.email}</p>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '900', color: '#39FF14' }}>
                                    {formatPrice(req.amount)}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{
                                        background: 'rgba(57,255,20,0.05)',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(57,255,20,0.1)'
                                    }}>
                                        <p style={{ fontWeight: '700', color: '#39FF14', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                            <Landmark size={12} /> {req.bankName || req.bank_name || '-'}
                                        </p>
                                        <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                            {req.accountNumber || req.account_number || '-'}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                            a.n. {req.accountName || req.account_name || '-'}
                                        </p>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        background: req.status === 'approved' ? 'rgba(57,255,20,0.1)' :
                                            req.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: req.status === 'approved' ? '#39FF14' :
                                            req.status === 'pending' ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {req.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                    {new Date(req.createdAt || req.created_at).toLocaleDateString('id-ID')}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {req.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                style={{
                                                    background: '#39FF14',
                                                    color: 'black',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '6px',
                                                    fontWeight: '700',
                                                    fontSize: '0.75rem',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <CheckCircle2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                style={{
                                                    background: 'rgba(239,68,68,0.1)',
                                                    color: '#ef4444',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '6px',
                                                    fontWeight: '700',
                                                    fontSize: '0.75rem',
                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                    <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}><Upload size={40} /></div>
                                    <p>Tidak ada request penarikan</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
