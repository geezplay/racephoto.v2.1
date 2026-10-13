import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder, chargePayment, checkPaymentStatus, validateDiscount } from '../services/api';
import {
    Camera, ChevronLeft, Check, AlertTriangle, ClipboardList, Mail, Smartphone, Tag,
    CreditCard, Landmark, Circle, Receipt, Lock, Wallet, Timer, RefreshCw, BookOpen
} from 'lucide-react';

const PayIcon = ({ method }: { method: string }) => {
    const size = 18;
    switch (method) {
        case 'qris':
            return <Smartphone size={size} />;
        case 'gopay':
            return <Wallet size={size} color="#00aae0" />;
        case 'dana':
            return <Wallet size={size} color="#1890ff" />;
        case 'bni_va':
        case 'bri_va':
        case 'permata_va':
        case 'cimb_va':
        case 'mandiri_bill':
            return <Landmark size={size} />;
        default:
            return <CreditCard size={size} />;
    }
};

const BankDot = ({ color }: { color: string }) => (
    <Circle size={16} fill={color} color={color} />
);

export default function Payment() {
    const navigate = useNavigate();
    const { items, getTotal, getCount, clearCart } = useCart();
    const [checkoutData, setCheckoutData] = useState<any>({ email: '', whatsapp: '' });
    const [step, setStep] = useState(1); // 1: Checkout form, 2: Payment display
    const [selectedMethod, setSelectedMethod] = useState('qris'); // 'qris', 'gopay', 'dana', 'bni_va', 'bri_va', 'permata_va', 'cimb_va', 'mandiri_bill'
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderId, setOrderId] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    const [paymentData, setPaymentData] = useState<any>(null);
    const [countdown, setCountdown] = useState<any>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const paymentCompleted = useRef(false);
    const pollRef = useRef<any>(null);
    const countdownRef = useRef<any>(null);

    // Discount state
    const [discountCode, setDiscountCode] = useState('');
    const [discountInfo, setDiscountInfo] = useState<any>(null);
    const [discountError, setDiscountError] = useState('');
    const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

    useEffect(() => {
        if (items.length === 0 && !paymentCompleted.current && !isProcessing && step === 1) {
            navigate('/');
        }
    }, [items, navigate, isProcessing, step]);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const subtotal = getTotal();
    const discountAmount = discountInfo?.amount || 0;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const isGmailValid = checkoutData.email.toLowerCase().trim().endsWith('@gmail.com');
    const isWhatsAppValid = checkoutData.whatsapp.length >= 10;
    const isFormComplete = isGmailValid && isWhatsAppValid;

    // Admin fee — dynamic based on selected method
    const isBankMethod = ['bni_va', 'bri_va', 'permata_va', 'cimb_va', 'mandiri_bill'].includes(selectedMethod);
    const adminFeeRate = selectedMethod === 'gopay' ? 0.02 : (isBankMethod ? 0 : 0.007);
    const adminFee = isBankMethod ? 4000 : Math.ceil(subtotal * adminFeeRate);
    const adminFeeLabel = {
        qris: 'QRIS (0.7%)', gopay: 'GoPay (2%)', dana: 'DANA via QRIS (0.7%)',
        bni_va: 'BNI VA (Rp 4.000)', bri_va: 'BRI VA (Rp 4.000)',
        permata_va: 'Permata VA (Rp 4.000)', cimb_va: 'CIMB VA (Rp 4.000)',
        mandiri_bill: 'Mandiri (Rp 4.000)'
    }[selectedMethod] || selectedMethod;
    const grandTotal = discountedSubtotal + adminFee;

    // Validate discount code
    const handleValidateDiscount = async () => {
        if (!discountCode.trim()) return;
        setIsValidatingDiscount(true);
        setDiscountError('');
        setDiscountInfo(null);
        try {
            const cartItems = items.map(item => ({
                photoId: item.photoId,
                price: item.price,
                eventId: item.eventId
            }));
            const res = await validateDiscount(discountCode.trim(), subtotal, cartItems);
            setDiscountInfo({
                amount: res.data.discount_amount,
                label: res.data.label,
                code: res.data.code,
                eligibleCount: res.data.eligible_photo_count,
                maxPhotos: res.data.max_photos
            });
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Kode diskon tidak valid';
            setDiscountError(msg);
        } finally {
            setIsValidatingDiscount(false);
        }
    };

    const handleRemoveDiscount = () => {
        setDiscountInfo(null);
        setDiscountCode('');
        setDiscountError('');
    };

    // Polling for payment status (every 3 seconds)
    const startPolling = useCallback((oid: any) => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const res = await checkPaymentStatus(oid);
                if (res.data?.status === 'success') {
                    clearInterval(pollRef.current);
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    navigate(`/success?order_id=${oid}&status=success`);
                }
            } catch (e: any) { /* continue */ }
        }, 3000);
    }, [navigate]);

    // Manual status check — user clicks button after paying
    const handleCheckStatus = async () => {
        if (!orderId || isCheckingStatus) return;
        setIsCheckingStatus(true);
        try {
            const res = await checkPaymentStatus(orderId);
            if (res.data?.status === 'success') {
                if (pollRef.current) clearInterval(pollRef.current);
                if (countdownRef.current) clearInterval(countdownRef.current);
                navigate(`/success?order_id=${orderId}&status=success`);
            } else {
                setStatusMsg('Pembayaran belum terdeteksi. Coba lagi dalam beberapa detik...');
                setTimeout(() => setStatusMsg(''), 3000);
            }
        } catch (e: any) {
            setStatusMsg('Gagal cek status. Coba lagi...');
            setTimeout(() => setStatusMsg(''), 3000);
        } finally {
            setIsCheckingStatus(false);
        }
    };

    // Countdown timer (15 minutes)
    const startCountdown = useCallback((isBankTransfer: any) => {
        const duration = isBankTransfer ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
        const expiry = Date.now() + duration;
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            const remaining = Math.max(0, expiry - Date.now());
            if (remaining <= 0) {
                clearInterval(countdownRef.current);
                setCountdown('00:00:00');
                return;
            }
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            if (isBankTransfer) {
                setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
            } else {
                setCountdown(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
            }
        }, 1000);
    }, []);

    // Create order + Charge payment
    const handlePayNow = async () => {
        if (!isFormComplete) return;
        setIsProcessing(true);
        setErrorMsg('');
        setStatusMsg('Membuat pesanan...');
        try {
            // Step 1: Create order (with discount)
            const mappedItems = items.map(item => ({
                photoId: item.photoId,
                price: item.price,
                variant: item.variant || 1,
            }));
            const orderResponse = await createOrder({
                email: checkoutData.email,
                whatsapp: checkoutData.whatsapp,
                items: mappedItems,
                discountCode: discountInfo?.code || null
            });
            const newOrderId = orderResponse.data.order_id || orderResponse.data.orderId || orderResponse.data.id;
            setOrderId(newOrderId);
            localStorage.setItem('pending_order_id', newOrderId.toString());
            // Keep the guest access token so unauthenticated buyers can view their order later.
            if (orderResponse.data.guest_token) {
                localStorage.setItem(`racephoto_order_${newOrderId}`, orderResponse.data.guest_token);
            }
            paymentCompleted.current = true;
            clearCart();

            // Step 2: Charge via Core API (DANA maps to QRIS internally)
            const backendMethod = selectedMethod === 'dana' ? 'qris' : selectedMethod;
            const METHOD_LABELS: Record<string, string> = {
                qris: 'QRIS', gopay: 'GoPay', dana: 'DANA',
                bni_va: 'BNI VA', bri_va: 'BRI VA', permata_va: 'Permata VA',
                cimb_va: 'CIMB VA', mandiri_bill: 'Mandiri'
            };
            const methodLabel = METHOD_LABELS[selectedMethod] || selectedMethod.toUpperCase();
            setStatusMsg(`Membuat pembayaran ${methodLabel}...`);
            const chargeRes = await chargePayment(newOrderId, backendMethod);
            const data = chargeRes.data;

            setIsProcessing(false);
            setStatusMsg('');
            setPaymentData(data);
            setStep(2);
            startPolling(newOrderId);
            const isBankTransfer = ['bni_va', 'bri_va', 'permata_va', 'cimb_va', 'mandiri_bill'].includes(selectedMethod);
            startCountdown(isBankTransfer);
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || 'Gagal memproses pembayaran.';
            setErrorMsg(msg);
            setIsProcessing(false);
            setStatusMsg('');
        }
    };

    // =================== STYLES ===================
    const S = {
        card: {
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            marginBottom: '1rem'
        },
        sectionHeader: {
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            fontWeight: '900',
            color: '#39FF14',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
        },
        input: {
            width: '100%',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '0.875rem 1.25rem',
            color: 'white',
            fontSize: '0.95rem',
            boxSizing: 'border-box' as const
        },
        btnPrimary: (enabled: any) => ({
            width: '100%',
            padding: '1rem',
            borderRadius: '12px',
            fontWeight: '900',
            textTransform: 'uppercase',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
            border: 'none',
            cursor: enabled ? 'pointer' : 'not-allowed',
            background: enabled ? '#39FF14' : 'rgba(255,255,255,0.05)',
            color: enabled ? 'black' : 'rgba(255,255,255,0.2)',
            boxShadow: enabled ? '0 0 20px rgba(57,255,20,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
        }),
        divider: {
            height: '1px',
            background: 'rgba(255,255,255,0.06)',
            margin: '1.25rem 0'
        }
    };

    return (
        <div className="app-wrapper">
            <nav className="main-navbar">
                <div className="navbar-inner">
                    <Link to="/" className="logo-link">
                        <div className="logo-icon"><Camera size={20} /></div>
                        <span className="logo-text">GEEZ<span className="accent">PLAY</span></span>
                    </Link>
                </div>
            </nav>

            <div style={{ paddingTop: '6rem', paddingBottom: '6rem', maxWidth: '600px', margin: '0 auto', padding: '6rem 1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => {
                            if (step === 2) return;
                            navigate('/cart');
                        }}
                        disabled={isProcessing || step === 2}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.625rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            cursor: (isProcessing || step === 2) ? 'not-allowed' : 'pointer',
                            opacity: (isProcessing || step === 2) ? 0.5 : 1
                        }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h2 style={{
                        fontSize: '1.5rem', fontWeight: '900', textTransform: 'uppercase',
                        fontStyle: 'italic', letterSpacing: '-0.02em'
                    }}>
                        {step === 1 ? 'Checkout' : 'Scan QRIS'}
                    </h2>
                </div>

                {/* Step Indicator */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {[1, 2].map(s => (
                        <div key={s} style={{
                            flex: 1, height: '3px', borderRadius: '4px',
                            background: s <= step ? '#39FF14' : 'rgba(255,255,255,0.1)',
                            transition: 'background 0.3s ease'
                        }} />
                    ))}
                </div>

                {/* Error */}
                {errorMsg && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '12px', padding: '1rem', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <span style={{ color: '#ef4444' }}><AlertTriangle size={20} /></span>
                        <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{errorMsg}</p>
                    </div>
                )}

                {/* =================== STEP 1: CHECKOUT FORM =================== */}
                {step === 1 && (
                    <>
                        {/* Section A: Buyer Info */}
                        <div style={S.card}>
                            <div style={S.sectionHeader}><ClipboardList size={14} /> Data Pembeli</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Mail size={14} className="inline" /> Email (Wajib @gmail.com)
                                    </label>
                                    <input
                                        type="email"
                                        value={checkoutData.email}
                                        onChange={(e) => setCheckoutData({ ...checkoutData, email: (e.target as any).value })}
                                        placeholder="contoh@gmail.com"
                                        style={{
                                            ...S.input,
                                            border: checkoutData.email && !isGmailValid ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    />
                                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                                        File foto akan dikirim ke email ini.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Smartphone size={14} className="inline" /> WhatsApp (Aktif)
                                    </label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={checkoutData.whatsapp}
                                        onChange={(e) => {
                                            const val = (e.target as any).value.replace(/[^0-9]/g, '');
                                            setCheckoutData({ ...checkoutData, whatsapp: val });
                                        }}
                                        placeholder="0812..."
                                        style={S.input}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section B: Discount Code */}
                        <div style={S.card}>
                            <div style={S.sectionHeader}><Tag size={14} /> Kode Diskon</div>
                            {discountInfo ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.3)',
                                    borderRadius: '12px', padding: '0.875rem 1.25rem'
                                }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#39FF14', margin: '0 0 2px' }}>
                                            <Check size={14} className="inline" /> {discountInfo.code}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                                            Diskon {discountInfo.label} (−Rp {discountInfo.amount.toLocaleString()})
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleRemoveDiscount}
                                        style={{
                                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                            borderRadius: '8px', padding: '0.4rem 0.75rem', color: '#ef4444',
                                            fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer'
                                        }}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={discountCode}
                                        onChange={(e) => { setDiscountCode((e.target as any).value.toUpperCase()); setDiscountError(''); }}
                                        placeholder="Masukkan kode..."
                                        style={{ ...S.input, flex: 1, textTransform: 'uppercase' }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleValidateDiscount()}
                                    />
                                    <button
                                        onClick={handleValidateDiscount}
                                        disabled={!discountCode.trim() || isValidatingDiscount}
                                        style={{
                                            background: discountCode.trim() ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.03)',
                                            border: discountCode.trim() ? '1px solid rgba(57,255,20,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', padding: '0 1.25rem',
                                            color: discountCode.trim() ? '#39FF14' : 'rgba(255,255,255,0.2)',
                                            fontWeight: '800', fontSize: '0.75rem', cursor: discountCode.trim() ? 'pointer' : 'not-allowed',
                                            textTransform: 'uppercase', whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {isValidatingDiscount ? '...' : 'Terapkan'}
                                    </button>
                                </div>
                            )}
                            {discountError && (
                                <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.5rem 0 0', fontWeight: '600' }}>
                                    <AlertTriangle size={12} className="inline" />  {discountError}
                                </p>
                            )}
                        </div>

                        {/* Section C: Payment Method Selection */}
                        <div style={S.card}>
                            <div style={S.sectionHeader}><CreditCard size={14} /> Metode Pembayaran</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* QRIS */}
                                <div
                                    onClick={() => !isProcessing && setSelectedMethod('qris')}
                                    style={{
                                        background: selectedMethod === 'qris' ? 'rgba(57,255,20,0.08)' : 'rgba(255,255,255,0.02)',
                                        border: selectedMethod === 'qris' ? '2px solid rgba(57,255,20,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '14px', padding: '1rem',
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: selectedMethod === 'qris' ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}><PayIcon method="qris" /></div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: '800', fontSize: '0.9rem', margin: '0 0 0.15rem', color: 'white' }}>QRIS</p>
                                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Scan QR — semua e-wallet & bank</p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontSize: '0.6rem', color: 'rgba(255,179,71,0.8)', margin: '0 0 0.15rem', fontWeight: '700' }}>Fee 0.7%</p>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%', marginLeft: 'auto',
                                            background: selectedMethod === 'qris' ? '#39FF14' : 'rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {selectedMethod === 'qris' && <span style={{ color: 'black', fontSize: '12px', fontWeight: '900' }}><Check size={12} /></span>}
                                        </div>
                                    </div>
                                </div>

                                {/* GoPay */}
                                <div
                                    onClick={() => !isProcessing && setSelectedMethod('gopay')}
                                    style={{
                                        background: selectedMethod === 'gopay' ? 'rgba(0,170,224,0.08)' : 'rgba(255,255,255,0.02)',
                                        border: selectedMethod === 'gopay' ? '2px solid rgba(0,170,224,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '14px', padding: '1rem',
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: selectedMethod === 'gopay' ? 'rgba(0,170,224,0.15)' : 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}><PayIcon method="gopay" /></div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: '800', fontSize: '0.9rem', margin: '0 0 0.15rem', color: 'white' }}>GoPay</p>
                                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Bayar langsung via GoPay</p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontSize: '0.6rem', color: 'rgba(255,179,71,0.8)', margin: '0 0 0.15rem', fontWeight: '700' }}>Fee 2%</p>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%', marginLeft: 'auto',
                                            background: selectedMethod === 'gopay' ? '#00aae0' : 'rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {selectedMethod === 'gopay' && <span style={{ color: 'white', fontSize: '12px', fontWeight: '900' }}><Check size={12} /></span>}
                                        </div>
                                    </div>
                                </div>

                                {/* DANA */}
                                <div
                                    onClick={() => !isProcessing && setSelectedMethod('dana')}
                                    style={{
                                        background: selectedMethod === 'dana' ? 'rgba(24,144,255,0.08)' : 'rgba(255,255,255,0.02)',
                                        border: selectedMethod === 'dana' ? '2px solid rgba(24,144,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '14px', padding: '1rem',
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: selectedMethod === 'dana' ? 'rgba(24,144,255,0.15)' : 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}><PayIcon method="dana" /></div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: '800', fontSize: '0.9rem', margin: '0 0 0.15rem', color: 'white' }}>DANA</p>
                                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Bayar via DANA (scan QRIS)</p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontSize: '0.6rem', color: 'rgba(255,179,71,0.8)', margin: '0 0 0.15rem', fontWeight: '700' }}>Fee 0.7%</p>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%', marginLeft: 'auto',
                                            background: selectedMethod === 'dana' ? '#1890ff' : 'rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {selectedMethod === 'dana' && <span style={{ color: 'white', fontSize: '12px', fontWeight: '900' }}><Check size={12} /></span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Transfer Section */}
                                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem' }}>
                                        <Landmark size={14} className="inline" /> Transfer Bank (Virtual Account)
                                    </p>

                                    {/* Bank cards */}
                                    {[
                                        { key: 'mandiri_bill', name: 'Mandiri', color: '3,46,130', dot: '#032e82' },
                                        { key: 'bni_va', name: 'BNI', color: '246,139,31', dot: '#f68b1f' },
                                        { key: 'bri_va', name: 'BRI', color: '0,74,173', dot: '#004aad' },
                                        { key: 'permata_va', name: 'Permata', color: '0,152,79', dot: '#00984f' },
                                        { key: 'cimb_va', name: 'CIMB Niaga', color: '176,0,32', dot: '#b00020' }
                                    ].map(bank => (
                                        <div
                                            key={bank.key}
                                            onClick={() => !isProcessing && setSelectedMethod(bank.key)}
                                            style={{
                                                background: selectedMethod === bank.key ? `rgba(${bank.color},0.08)` : 'rgba(255,255,255,0.02)',
                                                border: selectedMethod === bank.key ? `2px solid rgba(${bank.color},0.5)` : '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '14px', padding: '0.875rem 1rem',
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s ease',
                                                marginBottom: '0.5rem'
                                            }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                background: selectedMethod === bank.key ? `rgba(${bank.color},0.15)` : 'rgba(255,255,255,0.05)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}><BankDot color={bank.dot} /></div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '800', fontSize: '0.85rem', margin: '0 0 0.1rem', color: 'white' }}>{bank.name}</p>
                                                <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Virtual Account</p>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <p style={{ fontSize: '0.6rem', color: 'rgba(255,179,71,0.8)', margin: '0 0 0.15rem', fontWeight: '700' }}>Rp 4.000</p>
                                                <div style={{
                                                    width: '20px', height: '20px', borderRadius: '50%', marginLeft: 'auto',
                                                    background: selectedMethod === bank.key ? `rgb(${bank.color})` : 'rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {selectedMethod === bank.key && <span style={{ color: 'white', fontSize: '12px', fontWeight: '900' }}><Check size={12} /></span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section D: Order Summary */}
                        <div style={S.card}>
                            <div style={S.sectionHeader}><Receipt size={14} /> Ringkasan Pesanan</div>

                            {/* Item List */}
                            <div style={{
                                maxHeight: items.length > 4 ? '200px' : 'auto',
                                overflowY: items.length > 4 ? 'auto' : 'visible',
                                marginBottom: '1rem',
                                paddingRight: items.length > 4 ? '0.5rem' : 0
                            }}>
                                {items.map((item, idx) => (
                                    <div key={item.cartItemId || idx} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.625rem 0',
                                        borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: 'rgba(57,255,20,0.08)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}><Camera size={12} /></div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    Start #{item.startNo} — V{item.variant || 1}
                                                </p>
                                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                                                    {item.className || 'Kelas Umum'}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                                            Rp {(item.price || 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={S.divider} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                    Subtotal ({getCount()} foto)
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600' }}>
                                    Rp {subtotal.toLocaleString()}
                                </span>
                            </div>

                            {discountInfo && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#39FF14', fontSize: '0.8rem' }}>
                                        Diskon ({discountInfo.label})
                                    </span>
                                    <span style={{ color: '#39FF14', fontSize: '0.8rem', fontWeight: '600' }}>
                                        −Rp {discountAmount.toLocaleString()}
                                    </span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'rgba(255,179,71,0.8)', fontSize: '0.8rem' }}>
                                    Biaya Admin {adminFeeLabel}
                                </span>
                                <span style={{ color: 'rgba(255,179,71,0.8)', fontSize: '0.8rem', fontWeight: '600' }}>
                                    Rp {adminFee.toLocaleString()}
                                </span>
                            </div>

                            <div style={S.divider} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'white', fontSize: '0.95rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                    Total Bayar
                                </span>
                                <span style={{ color: '#39FF14', fontWeight: '900', fontSize: '1.5rem', fontStyle: 'italic' }}>
                                    Rp {grandTotal.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Secure badge */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', borderRadius: '12px',
                            background: 'rgba(57,255,20,0.03)', border: '1px solid rgba(57,255,20,0.08)'
                        }}>
                            <span style={{ color: 'rgba(57,255,20,0.5)' }}><Lock size={14} /></span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: '0.05em' }}>
                                Pembayaran aman & terenkripsi via Midtrans
                            </span>
                        </div>

                        {/* Pay button */}
                        <button
                            onClick={handlePayNow}
                            disabled={!isFormComplete || isProcessing}
                            style={S.btnPrimary(isFormComplete && !isProcessing)}
                        >
                            {isProcessing ? (
                                <>
                                    <span style={{
                                        display: 'inline-block', width: '16px', height: '16px',
                                        border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid black',
                                        borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                                    }} />
                                    {statusMsg || 'Memproses...'}
                                </>
                            ) : (
                                <>{(() => {
                                    const names: Record<string, string> = { qris: 'QRIS', gopay: 'GoPay', dana: 'DANA', bni_va: 'BNI VA', bri_va: 'BRI VA', permata_va: 'Permata VA', cimb_va: 'CIMB Niaga VA', mandiri_bill: 'Mandiri' };
                                    return (<><PayIcon method={selectedMethod} /> Konfirmasi &amp; Bayar {names[selectedMethod] || selectedMethod} — Rp {grandTotal.toLocaleString()}</>);
                                })()}</>
                            )}
                        </button>

                        {isProcessing && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '0.75rem', marginTop: '1rem', padding: '1rem', borderRadius: '12px',
                                background: 'rgba(57,255,20,0.05)'
                            }}>
                                <span style={{
                                    display: 'inline-block', width: '20px', height: '20px',
                                    border: '2px solid rgba(57,255,20,0.2)', borderTop: '2px solid #39FF14',
                                    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                                }} />
                                <span style={{ color: '#39FF14', fontSize: '0.85rem', fontWeight: '700' }}>
                                    {statusMsg || 'Memproses...'}
                                </span>
                            </div>
                        )}
                    </>
                )}

                {/* =================== STEP 2: PAYMENT DISPLAY =================== */}
                {step === 2 && paymentData && (
                    <>
                        {/* Payment Info Card */}
                        <div style={{
                            ...S.card,
                            textAlign: 'center',
                            padding: '2rem 1.5rem'
                        }}>
                            {/* Countdown Timer */}
                            {countdown && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    background: (countdown === '00:00' || countdown === '00:00:00') ? 'rgba(239,68,68,0.1)' : 'rgba(57,255,20,0.08)',
                                    border: (countdown === '00:00' || countdown === '00:00:00') ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(57,255,20,0.2)',
                                    borderRadius: '10px', padding: '0.5rem 1rem', marginBottom: '1.5rem'
                                }}>
                                    <span style={{ color: '#39FF14' }}><Timer size={14} /></span>
                                    <span style={{
                                        fontFamily: 'monospace', fontWeight: '900', fontSize: '1.1rem',
                                        color: countdown === '00:00' ? '#ef4444' : '#39FF14'
                                    }}>
                                        {countdown}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                                        {countdown === '00:00' ? 'Expired' : 'tersisa'}
                                    </span>
                                </div>
                            )}

                            <h3 style={{
                                fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase',
                                fontStyle: 'italic', marginBottom: '0.5rem', color: 'white'
                            }}>
                                {paymentData.va_number || paymentData.bill_key
                                    ? `Transfer ke ${paymentData.payment_method === 'mandiri_bill' ? 'Mandiri' : (paymentData.bank || '').toUpperCase()}`
                                    : paymentData.payment_method === 'gopay' ? 'Bayar via GoPay'
                                        : selectedMethod === 'dana' ? 'Bayar via DANA'
                                            : 'Scan QR Code'}
                            </h3>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                                {paymentData.va_number || paymentData.bill_key
                                    ? 'Transfer ke nomor VA di bawah ini sebelum batas waktu habis'
                                    : paymentData.payment_method === 'gopay'
                                        ? 'Scan QR code atau buka langsung di aplikasi GoPay'
                                        : selectedMethod === 'dana'
                                            ? 'Buka aplikasi DANA & scan kode QR di bawah ini'
                                            : 'Buka aplikasi e-wallet & scan kode QR di bawah ini'}
                            </p>

                            {/* ---- QR Code Display (QRIS/GoPay/DANA) ---- */}
                            {!paymentData.va_number && !paymentData.bill_key && (
                                <div style={{
                                    background: 'white',
                                    borderRadius: '20px',
                                    padding: '1.5rem',
                                    display: 'inline-block',
                                    marginBottom: '1.5rem',
                                    boxShadow: '0 0 30px rgba(57,255,20,0.15)'
                                }}>
                                    {paymentData.qr_url ? (
                                        <img
                                            src={paymentData.qr_url}
                                            alt="QR Code"
                                            style={{ width: '220px', height: '220px', display: 'block' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '220px', height: '220px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#666', fontSize: '0.8rem'
                                        }}>
                                            QR Code tidak tersedia
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ---- VA Number Display (Bank Transfer) ---- */}
                            {paymentData.va_number && !paymentData.bill_key && (
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 0.5rem' }}>
                                        Nomor Virtual Account
                                    </p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#39FF14', fontFamily: 'monospace', letterSpacing: '2px', margin: '0 0 1rem', wordBreak: 'break-all' }}>
                                        {paymentData.va_number}
                                    </p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(paymentData.va_number);
                                            setStatusMsg('Nomor VA berhasil disalin!');
                                            setTimeout(() => setStatusMsg(''), 2000);
                                        }}
                                        style={{
                                            padding: '0.625rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(57,255,20,0.3)',
                                            background: 'rgba(57,255,20,0.1)', color: '#39FF14',
                                            fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                                        }}
                                    >
                                        <ClipboardList size={14} className="inline" /> Salin Nomor VA
                                    </button>
                                </div>
                            )}

                            {/* ---- Mandiri Bill Display (Biller Code + Bill Key) ---- */}
                            {paymentData.bill_key && (
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 0.25rem' }}>
                                            Kode Biller (Company Code)
                                        </p>
                                        <p style={{ fontSize: '1.3rem', fontWeight: '900', color: '#f59e0b', fontFamily: 'monospace', letterSpacing: '2px', margin: 0 }}>
                                            {paymentData.biller_code}
                                        </p>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 0.25rem' }}>
                                            Bill Key (Nomor VA)
                                        </p>
                                        <p style={{ fontSize: '1.3rem', fontWeight: '900', color: '#39FF14', fontFamily: 'monospace', letterSpacing: '2px', margin: 0, wordBreak: 'break-all' }}>
                                            {paymentData.bill_key}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(paymentData.bill_key);
                                            setStatusMsg('Bill Key berhasil disalin!');
                                            setTimeout(() => setStatusMsg(''), 2000);
                                        }}
                                        style={{
                                            padding: '0.625rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(57,255,20,0.3)',
                                            background: 'rgba(57,255,20,0.1)', color: '#39FF14',
                                            fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                                        }}
                                    >
                                        <ClipboardList size={14} className="inline" /> Salin Bill Key
                                    </button>
                                </div>
                            )}

                            {/* GoPay deeplink button (for mobile) */}
                            {paymentData.payment_method === 'gopay' && paymentData.deeplink_url && (
                                <a
                                    href={paymentData.deeplink_url}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: '12px',
                                        background: '#00aae0', color: 'white',
                                        fontWeight: '900', fontSize: '0.85rem', textDecoration: 'none',
                                        textTransform: 'uppercase', fontStyle: 'italic',
                                        boxShadow: '0 0 20px rgba(0,170,224,0.3)',
                                        marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' as const
                                    }}
                                >
                                    <Wallet size={18} className="inline" /> Buka Aplikasi GoPay
                                </a>
                            )}

                            {/* Supported apps */}
                            <div style={{
                                display: 'flex', justifyContent: 'center', gap: '0.75rem',
                                flexWrap: 'wrap', marginBottom: '1rem'
                            }}>
                                {(paymentData.payment_method === 'gopay'
                                    ? ['GoPay']
                                    : selectedMethod === 'dana'
                                        ? ['DANA']
                                        : ['GoPay', 'ShopeePay', 'DANA', 'OVO', 'LinkAja']
                                ).map(app => (
                                    <span key={app} style={{
                                        fontSize: '0.6rem', padding: '0.3rem 0.6rem',
                                        borderRadius: '6px', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.5)', fontWeight: '700'
                                    }}>
                                        {app}
                                    </span>
                                ))}
                            </div>

                            {/* Total amount */}
                            <div style={{
                                background: 'rgba(57,255,20,0.05)',
                                border: '1px solid rgba(57,255,20,0.15)',
                                borderRadius: '12px',
                                padding: '0.875rem',
                                marginBottom: '0.5rem'
                            }}>
                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 0.25rem' }}>
                                    Total Pembayaran
                                </p>
                                <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#39FF14', fontStyle: 'italic', margin: 0 }}>
                                    Rp {(paymentData.gross_amount || grandTotal).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div style={S.card}>
                            <div style={S.sectionHeader}><BookOpen size={14} /> Cara Pembayaran</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {(paymentData.bill_key ? [
                                    'Buka aplikasi Mandiri Online / m-Banking / ATM',
                                    'Pilih menu "Bayar" -> "Multipayment"',
                                    `Masukkan Kode Biller: ${paymentData.biller_code}`,
                                    `Masukkan Bill Key: ${paymentData.bill_key}`,
                                    'Konfirmasi dan selesaikan pembayaran',
                                    'Halaman akan otomatis update setelah pembayaran berhasil'
                                ] : paymentData.va_number ? [
                                    `Buka aplikasi m-Banking ${(paymentData.bank || '').toUpperCase()} atau kunjungi ATM`,
                                    'Pilih menu "Transfer" -> "Virtual Account"',
                                    `Masukkan nomor VA: ${paymentData.va_number}`,
                                    'Periksa detail dan konfirmasi pembayaran',
                                    'Halaman akan otomatis update setelah pembayaran berhasil'
                                ] : paymentData.payment_method === 'gopay' ? [
                                    'Buka aplikasi GoPay atau Gojek',
                                    'Klik tombol "Buka Aplikasi GoPay" di atas (mobile), atau scan QR code',
                                    'Konfirmasi pembayaran di aplikasi GoPay',
                                    'Halaman akan otomatis update setelah pembayaran berhasil'
                                ] : selectedMethod === 'dana' ? [
                                    'Buka aplikasi DANA di HP Anda',
                                    'Pilih menu "Scan" atau "Bayar"',
                                    'Arahkan kamera ke QR code di atas',
                                    'Konfirmasi pembayaran di aplikasi DANA',
                                    'Halaman akan otomatis update setelah pembayaran berhasil'
                                ] : [
                                    'Buka aplikasi e-wallet (GoPay, ShopeePay, DANA, OVO, dll)',
                                    'Pilih menu "Scan" atau "Bayar"',
                                    'Arahkan kamera ke QR code di atas',
                                    'Konfirmasi pembayaran di aplikasi Anda',
                                    'Halaman akan otomatis update setelah pembayaran berhasil'
                                ]).map((text, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.65rem', fontWeight: '900', color: '#39FF14',
                                            flexShrink: 0
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: '1.4' }}>
                                            {text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Manual Check Button */}
                        <button
                            onClick={handleCheckStatus}
                            disabled={isCheckingStatus}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                fontStyle: 'italic',
                                letterSpacing: '0.05em',
                                border: 'none',
                                cursor: isCheckingStatus ? 'not-allowed' : 'pointer',
                                background: '#39FF14',
                                color: 'black',
                                boxShadow: '0 0 20px rgba(57,255,20,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                marginBottom: '0.75rem',
                                opacity: isCheckingStatus ? 0.7 : 1
                            }}
                        >
                            {isCheckingStatus ? (
                                <>
                                    <span style={{
                                        display: 'inline-block', width: '16px', height: '16px',
                                        border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid black',
                                        borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                                    }} />
                                    Mengecek...
                                </>
                            ) : (
                                <><RefreshCw size={16} /> Sudah Bayar? Cek Status Pembayaran</>
                            )}
                        </button>

                        {/* Status message */}
                        {statusMsg && (
                            <div style={{
                                padding: '0.75rem', borderRadius: '10px', marginBottom: '0.75rem',
                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                                textAlign: 'center'
                            }}>
                                <p style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: '600', margin: 0 }}>
                                    {statusMsg}
                                </p>
                            </div>
                        )}

                        {/* Waiting indicator */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '0.75rem', padding: '0.75rem', borderRadius: '12px',
                            background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.1)',
                            marginBottom: '0.75rem'
                        }}>
                            <span style={{
                                display: 'inline-block', width: '14px', height: '14px',
                                border: '2px solid rgba(57,255,20,0.2)', borderTop: '2px solid #39FF14',
                                borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                            }} />
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '600' }}>
                                Auto-check setiap 3 detik...
                            </span>
                        </div>

                        <Link
                            to="/"
                            style={{
                                display: 'block', padding: '0.75rem', borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                                fontWeight: '700', fontSize: '0.8rem', textAlign: 'center',
                                textDecoration: 'none'
                            }}
                        >
                            Kembali ke Beranda
                        </Link>
                    </>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
