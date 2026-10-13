import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, ShoppingCart, ChevronLeft, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getEvent, getEvents } from '../services/api';

export default function Event() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [brand, setBrand] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const { getCount } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventRes, eventsRes] = await Promise.all([
                    getEvent(id),
                    getEvents()
                ]);
                setData(eventRes.data);
                setBrand(eventsRes.data.brand || {});
            } catch (error: any) {
                console.error('Error fetching event:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!data?.event) {
        return (
            <div className="loading-screen">
                <p style={{ color: 'white' }}>Event tidak ditemukan</p>
                <Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>Kembali</Link>
            </div>
        );
    }

    const { event, photoClasses } = data;
    const allClasses = [...new Set([
        ...(event.classes?.map((c: any) => c.name) || []),
        ...(photoClasses || [])
    ])];

    return (
        <div className="app-wrapper">
            {/* Navbar */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 80,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.9), rgba(0,0,0,0.8))',
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
                                    letterSpacing: '-0.02em',
                                    fontFamily: "'Archivo Black', sans-serif"
                                }}>
                                    {brand?.site_name || brand?.siteName || 'GEEZPLAY'}
                                </span>
                            </>
                        )}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link to="/cart" style={{
                            position: 'relative',
                            padding: '0.625rem',
                            borderRadius: '0.5rem',
                            transition: 'all 0.2s',
                            textDecoration: 'none'
                        }}>
                            <ShoppingCart size={24} color="white" />
                            {getCount() > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    background: '#39FF14',
                                    color: 'black',
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    width: '1.25rem',
                                    height: '1.25rem',
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
                </div>
            </nav>

            {/* Event Content */}
            <div style={{
                paddingTop: '6rem',
                paddingBottom: '8rem',
                maxWidth: '56rem',
                margin: '0 auto',
                padding: '6rem 1rem 8rem'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <Link
                        to="/"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.625rem',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            textDecoration: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        <ChevronLeft size={18} />
                    </Link>
                    <div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            fontStyle: 'italic',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                            fontFamily: "'Archivo Black', sans-serif"
                        }}>
                            {event.name}
                        </h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}>
                            Silakan Pilih Kelas Balapan
                        </p>
                    </div>
                </div>

                {/* Class Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1rem'
                }}>
                    {allClasses.length > 0 ? (
                        allClasses.map(className => (
                            <Link
                                key={className}
                                to={`/event/${event._id || event.id}/class/${encodeURIComponent(className)}`}
                                style={{
                                    background: '#0a0a0a',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    padding: '1.5rem',
                                    borderRadius: '1.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                                    textDecoration: 'none',
                                    color: 'white'
                                }}
                            >
                                <div>
                                    <p style={{
                                        color: '#39FF14',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        marginBottom: '0.25rem'
                                    }}>
                                        Kategori Kelas
                                    </p>
                                    <h4 style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 900,
                                        fontStyle: 'italic',
                                        letterSpacing: '-0.02em',
                                        textTransform: 'uppercase',
                                        fontFamily: "'Archivo Black', sans-serif"
                                    }}>
                                        {className}
                                    </h4>
                                </div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    transition: 'all 0.2s'
                                }}>
                                    <ArrowRight size={20} />
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '2.5rem',
                            background: '#0a0a0a',
                            borderRadius: '1.5rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.4)'
                        }}>
                            Belum ada kelas untuk event ini.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
