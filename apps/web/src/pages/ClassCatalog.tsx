import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Camera, ShoppingCart, X, Search, ClipboardList, Star, Check, AlertTriangle, CreditCard, ChevronLeft, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getClassPhotos, getPhoto, getEvents } from '../services/api';

export default function ClassCatalog() {
    const { eventId, className } = useParams();
    const [photos, setPhotos] = useState<any[]>([]);
    const [event, setEvent] = useState<any>(null);
    const [brand, setBrand] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [searchNo, setSearchNo] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<any>(null);
    const [preview, setPreview] = useState<{ url: string | null; updatedAt: string | null }>({ url: null, updatedAt: null });
    const { items, addItem, getCount, getTotal } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [photosRes, eventsRes] = await Promise.all([
                    getClassPhotos(eventId, className),
                    getEvents()
                ]);
                setPhotos(photosRes.data.photos || []);
                setEvent(photosRes.data.event || null);
                setPreview({
                    url: photosRes.data.previewUrl || null,
                    updatedAt: photosRes.data.previewUpdatedAt || null
                });
                setBrand(eventsRes.data.brand || {});
                if (typeof window !== 'undefined') {
                    localStorage.setItem('racephoto_last_catalog', window.location.pathname);
                }
            } catch (error: any) {
                console.error('Error fetching photos:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [eventId, className]);

    const filteredPhotos = useMemo(() => {
        return photos.filter(p => {
            const startNo = p.start_no || p.startNo || '';
            return searchNo === '' || startNo.toString().includes(searchNo);
        });
    }, [searchNo, photos]);

    const openPhotoDetail = async (photo: any) => {
        setLoadingDetail(true);
        setSelectedPhoto(photo);
        setSelectedVariantIndex(0);
        try {
            // Fetch full photo details with recaps
            const res = await getPhoto(photo.id || photo._id);
            setSelectedPhoto(res.data);
        } catch (error: any) {
            console.error('Error fetching photo details:', error);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closePhotoDetail = () => {
        setSelectedPhoto(null);
        setSelectedVariantIndex(0);
    };

    // Get variants (recaps only - these are the purchasable items)
    const getVariants = (photo: any) => {
        if (!photo.recaps || photo.recaps.length === 0) return [];
        return photo.recaps.map((recap: any, idx: any) => ({
            id: recap.id,
            variantNumber: recap.variant_number || idx + 1,
            url: recap.url
        }));
    };

    const addToCart = (e: any, photo: any, variantNumber: any, goToCheckout = false) => {
        if (e) e.stopPropagation();

        const variants = getVariants(photo);
        const variant = variants.find((v: any) => v.variantNumber === variantNumber);
        if (!variant) {
            alert('Varian tidak ditemukan');
            return;
        }

        // Check if this variant already in cart
        const photoId = photo.id || photo._id;
        const alreadyInCart = items.some(
            item => item.photoId === photoId && item.variant === variantNumber
        );
        if (!alreadyInCart) {
            addItem({
                id: photoId,
                url: variant.url,
                startNo: photo.start_no || photo.startNo,
                price: photo.price,
                className: decodeURIComponent(String(className)),
                eventName: event?.name || '',
                variant: variantNumber,
                recapCount: variants.length
            });
        }

        if (goToCheckout) {
            closePhotoDetail();
            navigate('/cart');
        }
    };

    const getCountInCart = (photoId: any) => items.filter(item => item.photoId === photoId).length;
    const isVariantInCart = (photoId: any, variantNumber: any) => items.some(item => item.photoId === photoId && item.variant === variantNumber);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'black', color: 'white' }}>
            {/* Navbar */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 80,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.9))',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '0 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '5rem'
                }}>
                    <Link to="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        color: 'white',
                        textDecoration: 'none'
                    }}>
                        {brand?.logo_url || brand?.siteLogo ? (
                            <img
                                src={(() => {
                                    const logoUrl = brand.logo_url || brand.siteLogo;
                                    if (logoUrl.startsWith('http')) return logoUrl;
                                    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${logoUrl}`;
                                })()}
                                alt={brand?.site_name || brand?.siteName || 'RacePhoto'}
                                style={{
                                    height: '40px',
                                    width: 'auto',
                                    maxWidth: '160px',
                                    objectFit: 'contain'
                                }}
                            />
                        ) : (
                            <>
                                <div style={{
                                    background: '#39FF14',
                                    padding: '0.375rem',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Camera size={20} color="black" />
                                </div>
                                <span style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 900,
                                    fontFamily: "'Archivo Black', sans-serif"
                                }}>
                                    {brand?.site_name || brand?.siteName || 'GEEZPLAY'}
                                </span>
                            </>
                        )}
                    </Link>
                    <Link to="/cart" style={{
                        position: 'relative',
                        padding: '0.625rem',
                        color: 'white',
                        textDecoration: 'none'
                    }}>
                        <ShoppingCart size={24} />
                        {getCount() > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                background: '#39FF14',
                                color: 'black',
                                fontSize: '10px',
                                fontWeight: 900,
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%'
                            }}>
                                {getCount()}
                            </span>
                        )}
                    </Link>
                </div>
            </nav>

            {/* Zoom Lightbox */}
            {zoomedImage && (
                <div
                    onClick={() => setZoomedImage(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.97)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0',
                        touchAction: 'none'
                    }}
                >
                    <button
                        onClick={() => setZoomedImage(null)}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 201
                        }}
                    >
                        <X size={24} />
                    </button>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'pinch-zoom',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        <img
                            src={zoomedImage}
                            alt="Zoomed preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100vh',
                                objectFit: 'contain',
                                touchAction: 'pinch-zoom'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Photo Detail Modal */}
            {selectedPhoto && (
                <div
                    onClick={closePhotoDetail}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.95)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                >
                    <button
                        onClick={closePhotoDetail}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '2rem',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={24} />
                    </button>

                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '900px',
                            width: '100%',
                            background: '#0a0a0a',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {loadingDetail ? (
                            <div style={{ padding: '4rem', textAlign: 'center' }}>
                                <div className="spinner"></div>
                            </div>
                        ) : (
                            <>
                                {/* Scrollable Content Area */}
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    {/* Main Preview Image — Click to Zoom */}
                                    <div style={{ position: 'relative', background: '#000' }}>
                                        <img
                                            src={selectedPhoto.photoUrl || selectedPhoto.url}
                                            alt={`Photo #${selectedPhoto.start_no || selectedPhoto.startNo}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setZoomedImage(selectedPhoto.photoUrl || selectedPhoto.url);
                                            }}
                                            style={{
                                                width: '100%',
                                                maxHeight: '50vh',
                                                objectFit: 'contain',
                                                cursor: 'zoom-in'
                                            }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            left: '1rem',
                                            background: 'rgba(0,0,0,0.8)',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            color: 'rgba(255,255,255,0.7)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}>
                                            <Camera size={14} /> PREVIEW
                                        </div>
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '1rem',
                                            right: '1rem',
                                            background: 'rgba(0,0,0,0.7)',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '8px',
                                            fontSize: '0.7rem',
                                            color: 'rgba(255,255,255,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}>
                                            <Search size={12} /> Tap untuk zoom
                                        </div>
                                    </div>

                                    {/* Info Section */}
                                    <div style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <div>
                                                <p style={{
                                                    fontSize: '10px',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em'
                                                }}>
                                                    Nomor Start
                                                </p>
                                                <p style={{
                                                    fontSize: '2rem',
                                                    fontWeight: 900,
                                                    fontStyle: 'italic'
                                                }}>
                                                    #{selectedPhoto.start_no || selectedPhoto.startNo}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{
                                                    fontSize: '10px',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    Harga Per Varian
                                                </p>
                                                <p style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: 900,
                                                    color: '#39FF14'
                                                }}>
                                                    Rp {(selectedPhoto.price || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Product Description Section */}
                                        <div style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '12px',
                                            padding: '1.25rem',
                                            marginBottom: '1.5rem'
                                        }}>
                                            <p style={{
                                                fontSize: '10px',
                                                color: 'rgba(255,255,255,0.4)',
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                marginBottom: '1rem'
                                            }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><ClipboardList size={12} /> Deskripsi Produk</span>
                                            </p>
                                            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
                                                <p style={{ marginBottom: '0.5rem' }}>
                                                    <strong style={{ color: '#39FF14' }}>Event:</strong> {event?.name || 'Racing Event'}
                                                </p>
                                                <p style={{ marginBottom: '0.5rem' }}>
                                                    <strong style={{ color: '#39FF14' }}>Kelas:</strong> {decodeURIComponent(String(className))}
                                                </p>
                                                <p style={{ marginBottom: '0.5rem' }}>
                                                    <strong style={{ color: '#39FF14' }}>Format:</strong> Digital Photo — JPEG High Resolution (Full HD / 4K)
                                                </p>
                                                <p style={{ marginBottom: '0.5rem' }}>
                                                    <strong style={{ color: '#39FF14' }}>Resolusi:</strong> Hingga 6000 x 4000 piksel — cocok untuk cetak besar maupun media sosial
                                                </p>
                                                <p style={{ marginBottom: '0.5rem' }}>
                                                    <strong style={{ color: '#39FF14' }}>Watermark:</strong> Foto preview memiliki watermark. Setelah pembayaran, Anda menerima file asli <strong>tanpa watermark</strong>
                                                </p>
                                                <p style={{ marginBottom: '0.5rem' }}>
                                                    <strong style={{ color: '#39FF14' }}>Lisensi:</strong> Penggunaan pribadi — posting ke media sosial, cetak pribadi, koleksi digital
                                                </p>
                                                <p style={{ marginBottom: '0.5rem' }}>
                                                    <strong style={{ color: '#39FF14' }}>Pengiriman:</strong> File dikirim via WhatsApp / Email dalam waktu maksimal 1x24 jam setelah pembayaran dikonfirmasi
                                                </p>
                                            </div>
                                        </div>

                                        {/* Product Advantages */}
                                        <div style={{
                                            background: 'rgba(57,255,20,0.03)',
                                            border: '1px solid rgba(57,255,20,0.1)',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            marginBottom: '1.5rem'
                                        }}>
                                            <p style={{
                                                fontSize: '10px',
                                                color: '#39FF14',
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                marginBottom: '0.75rem'
                                            }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Star size={12} /> Keunggulan Produk</span>
                                            </p>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                                                <p style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ color: '#39FF14', display: 'inline-flex' }}><Check size={14} /></span> Diambil oleh fotografer profesional berpengalaman di dunia balap
                                                </p>
                                                <p style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ color: '#39FF14', display: 'inline-flex' }}><Check size={14} /></span> Menggunakan kamera berkecepatan tinggi untuk menangkap setiap momen aksi
                                                </p>
                                                <p style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ color: '#39FF14', display: 'inline-flex' }}><Check size={14} /></span> Editing profesional — warna, kontras, dan ketajaman terbaik
                                                </p>
                                                <p style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ color: '#39FF14', display: 'inline-flex' }}><Check size={14} /></span> File resolusi tinggi siap cetak dan siap upload ke media sosial
                                                </p>
                                                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ color: '#39FF14', display: 'inline-flex' }}><Check size={14} /></span> Proses pembelian cepat dan aman melalui payment gateway terpercaya
                                                </p>
                                            </div>
                                        </div>

                                        {/* Terms Section */}
                                        <div style={{
                                            background: 'rgba(255,165,0,0.05)',
                                            border: '1px solid rgba(255,165,0,0.15)',
                                            borderRadius: '10px',
                                            padding: '1rem',
                                            fontSize: '0.75rem',
                                            color: 'rgba(255,255,255,0.6)',
                                            lineHeight: 1.7
                                        }}>
                                            <p style={{ marginBottom: '0.5rem', fontWeight: 700, color: 'rgba(255,165,0,0.9)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <AlertTriangle size={14} /> Syarat & Ketentuan
                                            </p>
                                            <p style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                <span>•</span> Foto yang dipesan adalah file digital berkualitas HD tanpa watermark
                                            </p>
                                            <p style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                <span>•</span> Setiap varian adalah foto berbeda dari sudut/momen berbeda dan tersedia secara terpisah
                                            </p>
                                            <p style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                <span>•</span> Foto untuk penggunaan pribadi — tidak diperkenankan untuk didistribusikan ulang
                                            </p>
                                            <p style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                <span>•</span> Pembayaran bersifat final — tidak dapat di-refund setelah file dikirim
                                            </p>
                                            <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                <span>•</span> Hubungi admin via WhatsApp jika ada pertanyaan atau kendala
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky Bottom Bar - Variant Selector + Action Buttons */}
                                {(() => {
                                    const variants = getVariants(selectedPhoto);
                                    if (variants.length === 0) {
                                        return (
                                            <div style={{
                                                padding: '1.5rem',
                                                borderTop: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                <div style={{
                                                    background: 'rgba(255,165,0,0.1)',
                                                    border: '1px solid rgba(255,165,0,0.3)',
                                                    borderRadius: '12px',
                                                    padding: '1.5rem',
                                                    textAlign: 'center'
                                                }}>
                                                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}><Camera size={32} color="rgba(255,255,255,0.4)" /></p>
                                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                                        Varian foto belum tersedia
                                                    </p>
                                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                        Silakan hubungi admin untuk upload varian
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const selectedVariant = variants[selectedVariantIndex];
                                    const photoId = selectedPhoto.id || selectedPhoto._id;
                                    const inCart = selectedVariant ? isVariantInCart(photoId, selectedVariant.variantNumber) : false;

                                    return (
                                        <div style={{
                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                            background: 'linear-gradient(to top, #0a0a0a, #111)',
                                            padding: '1rem 1.5rem',
                                            flexShrink: 0
                                        }}>
                                            {/* Variant info */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: '0.75rem'
                                            }}>
                                                <p style={{
                                                    fontSize: '10px',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em'
                                                }}>
                                                    Pilih Varian
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: '#39FF14', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Camera size={12} /> {variants.length} tersedia
                                                </p>
                                            </div>

                                            {/* Variant Buttons - Scrollable Horizontal */}
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                overflowX: 'auto',
                                                paddingBottom: '0.75rem',
                                                marginBottom: '0.75rem',
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: 'rgba(57,255,20,0.3) transparent'
                                            }}>
                                                {variants.map((variant: any, idx: any) => {
                                                    const vInCart = isVariantInCart(photoId, variant.variantNumber);
                                                    const isSelected = selectedVariantIndex === idx;

                                                    return (
                                                        <button
                                                            key={variant.id}
                                                            onClick={() => setSelectedVariantIndex(idx)}
                                                            style={{
                                                                padding: '0.625rem 1rem',
                                                                borderRadius: '10px',
                                                                cursor: 'pointer',
                                                                fontWeight: 900,
                                                                fontSize: '0.8rem',
                                                                whiteSpace: 'nowrap',
                                                                flexShrink: 0,
                                                                border: isSelected ? '2px solid #39FF14' : '1px solid rgba(255,255,255,0.2)',
                                                                background: vInCart ? 'rgba(57,255,20,0.2)' : isSelected ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.05)',
                                                                color: vInCart ? '#39FF14' : isSelected ? '#39FF14' : 'white',
                                                                boxShadow: isSelected ? '0 0 12px rgba(57,255,20,0.2)' : 'none',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {vInCart ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Check size={12} /> V{variant.variantNumber}</span>) : (<>V{variant.variantNumber}</>)}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Two Action Buttons */}
                                            {selectedVariant && (
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '0.75rem'
                                                }}>
                                                    {/* Tambah Varian Button */}
                                                    <button
                                                        onClick={(e) => addToCart(e, selectedPhoto, selectedVariant.variantNumber, false)}
                                                        disabled={inCart}
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.875rem',
                                                            borderRadius: '12px',
                                                            border: inCart ? '2px solid rgba(57,255,20,0.3)' : '2px solid #39FF14',
                                                            fontWeight: 900,
                                                            fontSize: '0.85rem',
                                                            textTransform: 'uppercase',
                                                            cursor: inCart ? 'not-allowed' : 'pointer',
                                                            background: inCart ? 'rgba(57,255,20,0.1)' : 'transparent',
                                                            color: inCart ? 'rgba(57,255,20,0.5)' : '#39FF14',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {inCart
                                                            ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Check size={14} /> V{selectedVariant.variantNumber} di Keranjang</span>)
                                                            : (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><ShoppingCart size={14} /> Tambah V{selectedVariant.variantNumber}</span>)
                                                        }
                                                    </button>

                                                    {/* Checkout Button */}
                                                    <button
                                                        onClick={(e) => addToCart(e, selectedPhoto, selectedVariant.variantNumber, true)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.875rem',
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            fontWeight: 900,
                                                            fontSize: '0.85rem',
                                                            textTransform: 'uppercase',
                                                            cursor: 'pointer',
                                                            background: '#39FF14',
                                                            color: 'black',
                                                            boxShadow: '0 8px 24px rgba(57,255,20,0.3)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CreditCard size={14} /> Checkout</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div style={{ paddingTop: '6rem', paddingBottom: '10rem', maxWidth: '1280px', margin: '0 auto', padding: '6rem 1rem 10rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <Link
                        to={`/event/${eventId}`}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.625rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            fontStyle: 'italic'
                        }}>
                            {decodeURIComponent(String(className))}
                        </h2>
                        <p style={{ color: '#39FF14', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {event?.name || 'Katalog Foto'}
                        </p>
                    </div>
                </div>

                {/* Class Preview Banner */}
                {preview.url ? (
                    <div style={{ width: '100%', maxWidth: '900px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', marginBottom: '1.5rem' }}>
                        <img src={preview.url} loading="lazy" alt="Preview kelas" style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'cover' }} />
                        {preview.updatedAt && (
                            <p style={{ padding: '0.6rem 1rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                                Preview kelas • diperbarui {new Date(preview.updatedAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                ) : (
                    <div style={{ width: '100%', maxWidth: '900px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.15)', background: '#0a0a0a', marginBottom: '1.5rem', padding: '2rem', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Preview kelas belum tersedia</p>
                    </div>
                )}

                {/* Search */}
                <div style={{ marginBottom: '2rem', maxWidth: '400px' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Cari Nomor Start (Contoh: 88)"
                            value={searchNo}
                            onChange={(e) => setSearchNo((e.target as any).value)}
                            style={{
                                width: '100%',
                                background: '#0a0a0a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '1rem 1rem 1rem 3rem',
                                color: 'white',
                                fontSize: '1rem',
                                boxSizing: 'border-box' as const
                            }}
                        />
                        <span style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Search size={18} />
                        </span>
                    </div>
                </div>

                {/* Photo Grid - Only Main Photo as Preview */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '0.75rem'
                }}>
                    {filteredPhotos.map(photo => {
                        const photoId = photo.id || photo._id;
                        const countInCart = getCountInCart(photoId);
                        const recapCount = photo.recapCount || photo.recap_count || 0;

                        return (
                            <div
                                key={photoId}
                                onClick={() => openPhotoDetail(photo)}
                                style={{
                                    position: 'relative',
                                    background: '#0a0a0a',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: countInCart > 0 ? '2px solid #39FF14' : '1px solid rgba(255,255,255,0.05)',
                                    boxShadow: countInCart > 0 ? '0 0 20px rgba(57,255,20,0.3)' : 'none',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {/* Main Photo Preview Only */}
                                <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
                                    <img
                                        src={photo.photoUrl || photo.url}
                                        alt={`Start #${photo.start_no || photo.startNo}`}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => { (e.target as HTMLInputElement).src = '/placeholder.jpg'; }}
                                    />

                                    {/* Start No Badge */}
                                    <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem' }}>
                                        <span style={{
                                            background: 'rgba(0,0,0,0.8)',
                                            color: 'white',
                                            fontSize: '10px',
                                            fontWeight: 900,
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            backdropFilter: 'blur(4px)'
                                        }}>
                                            #{photo.start_no || photo.startNo}
                                        </span>
                                    </div>

                                    {/* Variants Count Badge */}
                                    {recapCount > 0 && (
                                        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                                            <span style={{
                                                background: '#39FF14',
                                                color: 'black',
                                                fontSize: '9px',
                                                fontWeight: 900,
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px'
                                            }}>
                                                {recapCount} VARIAN
                                            </span>
                                        </div>
                                    )}

                                    {/* No Variants Warning */}
                                    {recapCount === 0 && (
                                        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                                            <span style={{
                                                background: 'rgba(255,165,0,0.9)',
                                                color: 'black',
                                                fontSize: '8px',
                                                fontWeight: 700,
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px'
                                            }}>
                                                PREVIEW
                                            </span>
                                        </div>
                                    )}

                                    {/* Cart Count Badge */}
                                    {countInCart > 0 && (
                                        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                                            <div style={{
                                                background: '#39FF14',
                                                color: 'black',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 900,
                                                fontSize: '11px',
                                                border: '2px solid black'
                                            }}>
                                                {countInCart}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Price & View Button */}
                                <div style={{
                                    padding: '1rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <p style={{ color: '#39FF14', fontWeight: 900, fontSize: '1rem' }}>
                                        Rp {(photo.price || 0).toLocaleString()}
                                    </p>
                                    <span style={{
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '8px',
                                        background: recapCount > 0 ? 'rgba(57,255,20,0.2)' : 'rgba(255,255,255,0.1)',
                                        color: recapCount > 0 ? '#39FF14' : 'rgba(255,255,255,0.5)',
                                        fontWeight: 700,
                                        fontSize: '0.75rem'
                                    }}>
                                        {recapCount > 0 ? 'Lihat Varian' : 'Preview'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredPhotos.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Camera size={48} color="rgba(255,255,255,0.4)" /></span>
                        <p>Tidak ada foto ditemukan</p>
                    </div>
                )}
            </div>

            {/* Bottom Checkout Bar */}
            {getCount() > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '1rem',
                    paddingTop: '4rem',
                    background: 'linear-gradient(to top, black, rgba(0,0,0,0.95), transparent)',
                    zIndex: 70
                }}>
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <Link
                            to="/cart"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                background: '#39FF14',
                                color: 'black',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                padding: '1rem 1.5rem',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                boxShadow: '0 20px 40px rgba(57,255,20,0.3)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    background: 'black',
                                    color: '#39FF14',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 900
                                }}>
                                    {getCount()}
                                </div>
                                <span style={{ fontStyle: 'italic' }}>Lanjut Checkout</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontStyle: 'italic' }}>Rp {getTotal().toLocaleString()}</span>
                                <ArrowRight size={20} />
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
