import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Camera, Package, ChevronLeft, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';

export default function Cart() {
    const { items, removeItem, clearCart, getTotal, getCount } = useCart();

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<any>(null);
    const [confirmMessage, setConfirmMessage] = useState('');

    const showConfirm = (message: any, onConfirm: any) => {
        setConfirmMessage(message);
        setConfirmAction(() => onConfirm);
        setShowConfirmModal(true);
    };

    const handleConfirm = () => {
        if (confirmAction) confirmAction();
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const handleCancel = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const goBack = () => {
        const lastCatalog = localStorage.getItem('racephoto_last_catalog');
        if (lastCatalog) {
            window.location.href = lastCatalog;
        } else {
            window.history.back();
        }
    };

    // Get last catalog path for navigation
    const getLastCatalogPath = () => {
        return localStorage.getItem('racephoto_last_catalog') || '/';
    };

    return (
        <div className="app-wrapper">
            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div
                    className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
                    onClick={handleCancel}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
                            border: '1px solid rgba(57, 255, 20, 0.3)',
                            borderRadius: '24px',
                            padding: '2rem',
                            maxWidth: '400px',
                            width: '100%',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 30px rgba(57,255,20,0.1)'
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                marginBottom: '1rem'
                            }}>
                                <AlertTriangle size={48} color="#f59e0b" />
                            </div>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 900,
                                color: 'white',
                                textTransform: 'uppercase',
                                fontStyle: 'italic',
                                marginBottom: '0.5rem'
                            }}>
                                Konfirmasi
                            </h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '0.95rem'
                            }}>
                                {confirmMessage}
                            </p>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={handleCancel}
                                style={{
                                    padding: '0.875rem 2rem',
                                    borderRadius: '12px',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirm}
                                style={{
                                    padding: '0.875rem 2rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#39FF14',
                                    color: 'black',
                                    fontWeight: 900,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 25px rgba(57,255,20,0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-[80] bg-gradient-to-b from-black/95 via-black/90 to-black/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16 md:h-20">
                    <button onClick={goBack} className="flex items-center gap-3 text-white border-none bg-transparent cursor-pointer group">
                        <div className="bg-primary p-1.5 rounded-lg text-lg transition-shadow group-hover:shadow-[0_0_15px_rgba(57,255,20,0.5)] flex items-center">
                            <Camera size={20} className="text-black" />
                        </div>
                        <span className="text-xl font-black tracking-tight">
                            GEEZ<span className="text-primary">PLAY</span>
                        </span>
                    </button>
                    <div className="flex items-center">
                        <div className="bg-white/10 p-2 rounded-full relative">
                            <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                                {getCount()}
                            </span>
                            <Package size={20} />
                        </div>
                    </div>
                </div>
            </nav>



            {/* Cart Content */}
            <div className="pt-24 pb-48 max-w-5xl mx-auto px-4 min-h-screen overflow-y-auto">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={goBack}
                            className="bg-white/5 p-3 rounded-xl border border-white/10 text-white transition-all hover:bg-white/10 hover:border-primary cursor-pointer flex items-center"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none mb-1">
                                PILIH FOTO
                            </h2>
                            <p className="text-primary font-bold text-xs tracking-widest uppercase">
                                {getCount()} ITEM TERPILIH
                            </p>
                        </div>
                    </div>

                    {items.length > 0 && (
                        <button
                            onClick={() => showConfirm('Kosongkan keranjang belanja?', clearCart)}
                            className="btn-danger text-xs flex items-center gap-2"
                        >
                            <Trash2 size={14} /> Kosongkan Keranjang
                        </button>
                    )}
                </div>

                {/* Cart Items */}
                {items.length === 0 ? (
                    <div className="text-center py-20 bg-dark rounded-3xl border border-dashed border-white/5">
                        <span className="text-5xl block mb-4 opacity-20 flex justify-center"><Camera size={48} /></span>
                        <h3 className="text-xl font-black italic uppercase text-white/40">
                            Keranjang Kosong
                        </h3>
                        <Link
                            to="/"
                            className="mt-4 inline-block text-primary font-bold hover:underline"
                        >
                            Cari Foto Balap
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {items.map((item, index) => (
                            <div
                                key={item.cartItemId || index}
                                className="bg-dark rounded-3xl p-5 border border-white/10 relative overflow-hidden shadow-xl"
                            >
                                <div className="flex flex-col gap-6">
                                    <div className="flex gap-6 flex-wrap">
                                        {/* Privacy Placeholder (no preview) */}
                                        <div
                                            className="w-48 aspect-square bg-black rounded-2xl overflow-hidden relative flex-shrink-0 flex items-center justify-center"
                                            style={{
                                                background: 'linear-gradient(145deg, #111, #0a0a0a)',
                                                border: '1px solid rgba(255,255,255,0.06)'
                                            }}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <span style={{ opacity: 0.25 }}><Camera size={40} /></span>
                                                <span style={{
                                                    fontSize: '0.6rem',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.15em',
                                                    color: 'rgba(255,255,255,0.15)'
                                                }}>
                                                    Foto {index + 1}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-[200px]">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-primary font-black text-[10px] uppercase tracking-widest mb-1">
                                                        {item.className || 'KELAS UMUM'}
                                                    </p>
                                                    <h3 className="text-3xl font-black italic tracking-tight uppercase text-white">
                                                        START #{item.startNo}
                                                    </h3>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.photoId, item.variant)}
                                                    className="bg-white/5 p-2 rounded-xl text-white/30 border-none cursor-pointer transition-all hover:bg-red-500/20 hover:text-red-400 flex items-center"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="mt-4">
                                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">
                                                    <Camera size={12} className="inline" /> Foto Nomor: {item.variant || 1}
                                                </p>
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <p className="text-2xl font-black text-primary italic tracking-tight">
                                                    Rp {(item.price || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Bar */}
            {items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-dark/95 backdrop-blur-xl border-t border-white/10 z-[90]">
                    <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">
                                Total Sementara
                            </p>
                            <p className="text-4xl font-black text-primary italic tracking-tight leading-none">
                                Rp {getTotal().toLocaleString()}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                to={getLastCatalogPath()}
                                className="px-6 py-4 rounded-xl border border-white/10 text-white font-black uppercase italic tracking-wide text-center hover:bg-white/5 transition-all"
                            >
                                + Foto
                            </Link>
                            <Link
                                to="/payment"
                                className="px-8 py-4 bg-white text-black rounded-xl font-black uppercase italic tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all"
                            >
                                Checkout <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
