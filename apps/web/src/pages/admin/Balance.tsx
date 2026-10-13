import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { getAdminBalance, requestWithdrawal } from '../../services/api';
import { Wallet, Upload, Hourglass, Banknote } from 'lucide-react';

export default function Balance() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const res = await getAdminBalance();
            setBalance(res.data.balance || 0);
            setWithdrawals(res.data.withdrawals || []);
        } catch (error: any) {
            console.error('Error fetching balance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e: any) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;
        if (!bankName || !accountNumber || !accountName) {
            alert('Lengkapi semua data bank');
            return;
        }
        if (parseFloat(amount) < 50000) {
            alert('Minimal penarikan Rp 50.000');
            return;
        }
        if (parseFloat(amount) > balance) {
            alert('Saldo tidak mencukupi');
            return;
        }
        setSubmitting(true);
        try {
            await requestWithdrawal({
                amount: parseFloat(amount),
                bankName,
                accountNumber,
                accountName
            });
            fetchBalance();
            setShowForm(false);
            setAmount('');
            setBankName('');
            setAccountNumber('');
            setAccountName('');
            alert('Permintaan penarikan berhasil dikirim!');
        } catch (error: any) {
            console.error('Error requesting withdrawal:', error);
            alert(error.response?.data?.message || 'Gagal mengirim permintaan penarikan');
        } finally {
            setSubmitting(false);
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
            <AdminLayout title="Saldo & Penarikan">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Saldo & Penarikan" subtitle="Kelola saldo dan ajukan penarikan">
            {/* Balance Card */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(57,255,20,0.1), rgba(57,255,20,0.02))',
                padding: '2rem',
                borderRadius: '24px',
                border: '1px solid rgba(57,255,20,0.2)',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                        <Wallet size={18} /> Saldo Anda
                    </p>
                    <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#39FF14' }}>
                        {formatPrice(balance)}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: '#39FF14',
                        color: 'black',
                        padding: '1rem 2rem',
                        borderRadius: '12px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 15px 30px rgba(57,255,20,0.3)'
                    }}
                >
                    <Upload size={18} /> Ajukan Penarikan
                </button>
            </div>

            {/* Withdrawal Form */}
            {showForm && (
                <form onSubmit={handleWithdraw} style={{
                    background: '#0a0a0a',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '2rem',
                    maxWidth: '500px'
                }}>
                    {/* Amount */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: '900',
                            color: '#39FF14',
                            letterSpacing: '0.1em',
                            marginBottom: '0.5rem'
                        }}>
                            Jumlah Penarikan
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount((e.target as any).value)}
                            max={balance}
                            min={50000}
                            required
                            placeholder="Minimum Rp 50.000"
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

                    {/* Bank Name */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: '900',
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.1em',
                            marginBottom: '0.5rem'
                        }}>
                            Nama Bank
                        </label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName((e.target as any).value)}
                            required
                            placeholder="Contoh: BCA, BNI, Mandiri"
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

                    {/* Account Number */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: '900',
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.1em',
                            marginBottom: '0.5rem'
                        }}>
                            Nomor Rekening
                        </label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber((e.target as any).value)}
                            required
                            placeholder="Masukkan nomor rekening"
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

                    {/* Account Name */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: '900',
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.1em',
                            marginBottom: '0.5rem'
                        }}>
                            Nama Pemilik Rekening
                        </label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName((e.target as any).value)}
                            required
                            placeholder="Nama sesuai buku tabungan"
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

                    {/* Submit Button */}
                    <button type="submit" disabled={submitting} style={{
                        width: '100%',
                        background: '#39FF14',
                        color: 'black',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.5 : 1
                    }}>
                        {submitting ? (<><Hourglass size={16} /> Mengirim...</>) : (<><Upload size={16} /> Kirim Permintaan Penarikan</>)}
                    </button>
                </form>
            )}

            {/* Withdrawal History */}
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: '1rem' }}>
                Riwayat Penarikan
            </h3>
            <div style={{
                background: '#0a0a0a',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Tanggal</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Jumlah</th>
                            <th style={{ padding: '1rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawals.map((w, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                    {new Date(w.createdAt || w.created_at).toLocaleDateString('id-ID')}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '900', color: '#39FF14' }}>
                                    {formatPrice(w.amount)}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        background: w.status === 'approved' ? 'rgba(57,255,20,0.1)' :
                                            w.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: w.status === 'approved' ? '#39FF14' :
                                            w.status === 'pending' ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {w.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {withdrawals.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                    <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}><Banknote size={40} /></div>
                                    <p>Belum ada riwayat penarikan</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
