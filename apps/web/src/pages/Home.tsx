import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getEvents, getUpcomingEvents } from '../services/api';
import { ShoppingCart, User, Menu, X, Camera, Calendar, Info, Briefcase, Home as HomeIcon, Zap, Phone, Tag, CreditCard, Users, ChevronDown, Search, MapPin, ArrowRight, Clock, Link2, Flag, Wallet, Check, Target, Sparkles, MessageCircle, Smartphone, Mail, CalendarDays, Download, Minus, Plus } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
    development: 'Development By',
    sponsor: 'Sponsor Utama',
    media: 'Media Partner',
};

const RACE_CATEGORY_LABELS: Record<string, string> = {
    drag: 'DRAG RACE',
    drift: 'DRIFT',
    rally: 'RALLY',
    touring: 'TOURING',
    moto: 'MOTO GP',
    road_race: 'ROAD RACE'
};

export default function Home() {
    const [data, setData] = useState<any>({ events: [], sponsors: {}, photographers: [], brand: {} });
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchData, setSearchData] = useState<any>({ event: '', location: '' });
    const [searchResults, setSearchResults] = useState<any>(null);
    const [countdowns, setCountdowns] = useState<any>({});
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isScrolled, setIsScrolled] = useState(false);
    const { getCount } = useCart();
    const navigate = useNavigate();

    // Scroll detection for navbar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventsRes, upcomingRes] = await Promise.all([
                    getEvents(),
                    getUpcomingEvents()
                ]);
                setData(eventsRes.data);
                setUpcomingEvents(upcomingRes.data?.events || []);
            } catch (error: any) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Countdown timer effect for all upcoming events
    useEffect(() => {
        if (upcomingEvents.length === 0) return;

        const updateCountdowns = () => {
            const now = new Date();
            const newCountdowns: Record<string, any> = {};

            upcomingEvents.forEach(event => {
                const targetDate = new Date(event.start_time || event.startTime);
                const diff = targetDate.getTime() - now.getTime();

                if (diff <= 0) {
                    newCountdowns[event.id] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
                } else {
                    newCountdowns[event.id] = {
                        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                        seconds: Math.floor((diff % (1000 * 60)) / 1000)
                    };
                }
            });

            setCountdowns(newCountdowns);
        };

        updateCountdowns();
        const interval = setInterval(updateCountdowns, 1000);
        return () => clearInterval(interval);
    }, [upcomingEvents]);

    const handleSearch = (e: any) => {
        e.preventDefault();
        const keyword = searchData.event.trim().toLowerCase();
        const loc = searchData.location;

        let filtered = data.events || [];

        if (keyword) {
            filtered = filtered.filter((ev: any) =>
                (ev.name || '').toLowerCase().includes(keyword)
            );
        }

        if (loc) {
            filtered = filtered.filter((ev: any) => ev.location === loc);
        }

        if (filtered.length === 1) {
            navigate(`/event/${filtered[0]._id || filtered[0].id}`);
        } else {
            setSearchResults(filtered);
            setTimeout(() => {
                document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    const handleOpenLightbox = (event: any, imageUrl: any) => {
        setSelectedEvent({ ...event, fullImageUrl: imageUrl });
        setZoomLevel(1);
    };

    const handleCloseLightbox = () => {
        setSelectedEvent(null);
        setZoomLevel(1);
    };

    const handleDownload = async () => {
        if (!selectedEvent?.fullImageUrl) return;
        try {
            const response = await fetch(selectedEvent.fullImageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `event-${selectedEvent.title || selectedEvent.name || 'image'}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Download error:', error);
            window.open(selectedEvent.fullImageUrl, '_blank');
        }
    };

    const handleZoomIn = () => setZoomLevel((prev: any) => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setZoomLevel((prev: any) => Math.max(prev - 0.5, 0.5));
    const handleResetZoom = () => setZoomLevel(1);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading...</p>
            </div>
        );
    }

    const { events, sponsors, photographers, brand } = data;
    const locations: string[] = [...new Set(events.map((e: any) => e.location).filter(Boolean))] as string[];

    return (
        <div className="app-wrapper">
            {/* MODERN NAVBAR - Gaming/Esports Style */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: isScrolled ? 'rgba(0,0,0,0.85)' : 'transparent',
                backdropFilter: isScrolled ? 'blur(12px)' : 'none',
                borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'all 0.3s ease'
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
                    {/* Logo with Skew Effect */}
                    <Link to="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        color: 'white',
                        textDecoration: 'none',
                        position: 'relative'
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
                                    height: '45px',
                                    width: 'auto',
                                    maxWidth: '180px',
                                    objectFit: 'contain'
                                }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                                {/* Pulse Decoration */}
                                <div style={{
                                    position: 'absolute',
                                    left: '-10px',
                                    width: '8px',
                                    height: '8px',
                                    background: '#39FF14',
                                    borderRadius: '50%',
                                    animation: 'pulse 2s infinite',
                                    boxShadow: '0 0 10px #39FF14'
                                }}></div>
                                <span style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 900,
                                    fontStyle: 'italic',
                                    letterSpacing: '-0.02em',
                                    fontFamily: "'Archivo Black', sans-serif",
                                    transform: 'skewX(-12deg)',
                                    display: 'inline-block',
                                    textShadow: '0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(57,255,20,0.3)'
                                }}>
                                    <span style={{ color: '#a855f7' }}>GEEZ</span>
                                    <span style={{ color: '#39FF14' }}> PLAY</span>
                                </span>
                            </div>
                        )}
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="desktop-nav" style={{
                        display: 'none',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        {[
                            { href: '#', label: 'HOME', icon: HomeIcon },
                            { href: '#upcoming', label: 'UPCOMING', icon: Calendar },
                            { href: '#events', label: 'EVENT', icon: Camera },
                            { href: '#layanan', label: 'LAYANAN', icon: Tag },
                            { href: '#photographers', label: 'FOTOGRAFER', icon: User },
                            { href: '#workflow', label: 'CARA KERJA', icon: Info },
                            { href: '#booking', label: 'BOOKING', icon: Briefcase },
                            { href: '#support', label: 'KONTAK', icon: Phone }
                        ].map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                style={{
                                    color: 'rgba(209,213,219,1)',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                    textDecoration: 'none',
                                    position: 'relative',
                                    transition: 'color 0.3s'
                                }}
                                className="nav-link-modern"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    {/* Right Section - Desktop */}
                    <div className="desktop-actions" style={{
                        display: 'none',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        {/* Cart */}
                        <Link to="/cart" style={{
                            position: 'relative',
                            padding: '0.625rem',
                            borderRadius: '0.5rem',
                            color: 'rgba(209,213,219,1)',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <ShoppingCart size={22} />
                            {getCount() > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
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

                        {/* Login Button with Glow */}
                        <Link to="/login" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#22c55e',
                            color: 'black',
                            padding: '0.625rem 1.25rem',
                            borderRadius: '0.5rem',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            transition: 'all 0.3s',
                            textDecoration: 'none',
                            boxShadow: '0 0 20px rgba(34,197,94,0.4)'
                        }}>
                            <User size={16} />
                            LOGIN
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        style={{
                            padding: '0.5rem',
                            color: 'white',
                            borderRadius: '0.5rem',
                            background: mobileMenuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s'
                        }}
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                <div style={{
                    maxHeight: mobileMenuOpen ? '500px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                    background: 'rgba(0,0,0,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderTop: mobileMenuOpen ? '1px solid rgba(255,255,255,0.05)' : 'none'
                }} className="mobile-menu">
                    <div style={{ padding: '1rem' }}>
                        {[
                            { href: '#', label: 'HOME', icon: HomeIcon },
                            { href: '#upcoming', label: 'UPCOMING', icon: Calendar },
                            { href: '#events', label: 'EVENT', icon: Camera },
                            { href: '#layanan', label: 'LAYANAN', icon: Tag },
                            { href: '#photographers', label: 'FOTOGRAFER', icon: User },
                            { href: '#workflow', label: 'CARA KERJA', icon: Info },
                            { href: '#booking', label: 'BOOKING', icon: Briefcase },
                            { href: '#support', label: 'KONTAK', icon: Phone }
                        ].map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        color: 'rgba(209,213,219,1)',
                                        padding: '0.875rem 1rem',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                        borderRadius: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <IconComponent size={18} style={{ color: '#39FF14' }} />
                                    {item.label}
                                </a>
                            );
                        })}

                        {/* Cart - Mobile */}
                        <Link
                            to="/cart"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                color: 'rgba(209,213,219,1)',
                                padding: '0.875rem 1rem',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                textDecoration: 'none',
                                borderRadius: '0.5rem'
                            }}
                        >
                            <ShoppingCart size={18} style={{ color: '#39FF14' }} />
                            KERANJANG
                            {getCount() > 0 && (
                                <span style={{
                                    background: '#39FF14',
                                    color: 'black',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '9999px',
                                    marginLeft: 'auto'
                                }}>
                                    {getCount()}
                                </span>
                            )}
                        </Link>

                        {/* Login Button - Mobile */}
                        <Link
                            to="/login"
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                background: '#22c55e',
                                color: 'black',
                                padding: '0.875rem',
                                borderRadius: '0.5rem',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                textTransform: 'uppercase',
                                textDecoration: 'none',
                                marginTop: '1rem',
                                boxShadow: '0 0 20px rgba(34,197,94,0.3)'
                            }}
                        >
                            <User size={18} />
                            LOGIN
                        </Link>
                    </div>
                </div>
            </nav>

            {/* CSS for Modern Navbar */}
            <style>{`
                @media (min-width: 1024px) {
                    .desktop-nav { display: flex !important; }
                    .desktop-actions { display: flex !important; }
                    .mobile-menu-btn { display: none !important; }
                    .mobile-menu { display: none !important; }
                }
                
                .nav-link-modern:hover {
                    color: white !important;
                }
                
                .nav-link-modern::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 0;
                    height: 2px;
                    background: #39FF14;
                    transition: all 0.3s ease;
                    transform: translateX(-50%);
                }
                
                .nav-link-modern:hover::after {
                    width: 80%;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
            `}</style>

            {/* HERO SECTION */}
            <section style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4), rgba(2,2,2,1))',
                        zIndex: 10
                    }}></div>
                    <img
                        src="https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=2000"
                        alt="Race Action"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'grayscale(1)',
                            opacity: 0.5,
                            transform: 'scale(1.1)'
                        }}
                    />
                </div>
                <div style={{
                    position: 'relative',
                    zIndex: 20,
                    textAlign: 'center',
                    paddingTop: '5rem',
                    padding: '5rem 1rem',
                    maxWidth: '56rem'
                }}>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                        fontWeight: 900,
                        fontStyle: 'italic',
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                        marginBottom: '1.5rem',
                        fontFamily: "'Archivo Black', sans-serif"
                    }}>
                        CAPTURE THE <span style={{ color: '#39FF14' }}>SPEED.</span>
                        <br />
                        OWN THE MOMENT.
                    </h1>
                    <p style={{
                        fontSize: 'clamp(0.875rem, 2vw, 1.25rem)',
                        color: 'rgba(255,255,255,0.7)',
                        maxWidth: '42rem',
                        margin: '0 auto 2.5rem'
                    }}>
                        Temukan foto aksi balapan profesionalmu — pilih event, temukan fotomu, bayar online, dan terima file resolusi tinggi dalam hitungan menit.
                    </p>
                </div>
                <div style={{
                    position: 'absolute',
                    bottom: '2.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#39FF14',
                    fontSize: '1.5rem'
                }} className="animate-bounce-slow">
                    <ChevronDown size={24} />
                </div>
            </section>

            {/* SEARCH SECTION */}
            <section style={{
                position: 'relative',
                zIndex: 50,
                marginTop: '-5rem',
                padding: '0 1rem'
            }}>
                <div style={{
                    maxWidth: '56rem',
                    margin: '0 auto',
                    background: '#0a0a0a',
                    padding: '1.5rem 2rem',
                    borderRadius: '1rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    borderTop: '4px solid #39FF14',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <form onSubmit={handleSearch} style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="input-label">NAMA EVENT</label>
                            <input
                                type="text"
                                placeholder="Cari event..."
                                value={searchData.event}
                                onChange={(e) => setSearchData({ ...searchData, event: (e.target as any).value })}
                                className="input-field"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="input-label">LOKASI</label>
                            <select
                                value={searchData.location}
                                onChange={(e) => setSearchData({ ...searchData, location: (e.target as any).value })}
                                className="input-field"
                            >
                                <option value="">Semua Lokasi</option>
                                {locations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary">
                                <Search size={18} /> CARI SEKARANG
                            </button>
                        </div>
                    </form>
                </div>

                {/* Search Results */}
                {searchResults !== null && (
                    <div id="search-results" style={{
                        maxWidth: '52rem',
                        margin: '1.5rem auto 0',
                        padding: '0 1rem'
                    }}>
                        <div style={{
                            background: '#0a0a0a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1rem',
                            padding: '1.5rem',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem'
                            }}>
                                <p style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    color: '#39FF14',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}>
                                    {searchResults.length > 0
                                        ? `${searchResults.length} Event Ditemukan`
                                        : 'Tidak Ada Hasil'}
                                </p>
                                <button
                                    onClick={() => setSearchResults(null)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'rgba(255,255,255,0.5)',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                ><X size={14} /> TUTUP</button>
                            </div>

                            {searchResults.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                                    Tidak ditemukan event untuk "{searchData.event}". Coba gunakan kata kunci lain.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {searchResults.map((ev: any) => (
                                        <Link
                                            key={ev._id || ev.id}
                                            to={`/event/${ev._id || ev.id}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.75rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '10px',
                                                textDecoration: 'none',
                                                color: 'white',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {(ev.imageUrl || ev.image) && (
                                                <img
                                                    src={ev.imageUrl || ev.image}
                                                    alt={ev.name}
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        flexShrink: 0
                                                    }}
                                                />
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontWeight: 800,
                                                    fontSize: '0.95rem',
                                                    textTransform: 'uppercase',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>{ev.name}</p>
                                                {ev.location && (
                                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
                                                        <MapPin size={12} /> {ev.location}
                                                    </p>
                                                )}
                                            </div>
                                            <span style={{
                                                background: 'rgba(57,255,20,0.1)',
                                                color: '#39FF14',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0
                                            }}>LIHAT KELAS <ArrowRight size={14} /></span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* UPCOMING EVENTS SECTION - Only show when events exist */}
            {upcomingEvents.length > 0 && (
                <section id="upcoming" style={{
                    padding: '5rem 0',
                    background: '#050505',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Grid Pattern Background */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                        backgroundSize: '50px 50px',
                        opacity: 0.5,
                        pointerEvents: 'none'
                    }}></div>

                    {/* Glow Effects */}
                    <div style={{
                        position: 'absolute',
                        top: '20%',
                        left: '-10%',
                        width: '400px',
                        height: '400px',
                        background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        bottom: '10%',
                        right: '-10%',
                        width: '400px',
                        height: '400px',
                        background: 'radial-gradient(circle, rgba(112,0,255,0.08) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }}></div>

                    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', position: 'relative', zIndex: 10 }}>
                        {/* Section Header */}
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: 'clamp(2rem, 5vw, 3rem)',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                                marginBottom: '1rem'
                            }}>
                                <span style={{ color: '#00F0FF' }}>UPCOMING</span>{' '}
                                <span style={{ color: 'white' }}>RACES</span>
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>
                                Jadwal event balap yang akan datang
                            </p>
                        </div>

                        {/* Events Grid */}
                        {upcomingEvents.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 380px))',
                                gap: '1.5rem',
                                justifyContent: 'center'
                            }}>
                                {upcomingEvents.map(event => {
                                    const countdown = countdowns[event.id] || { days: 0, hours: 0, minutes: 0, seconds: 0 };
                                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                                    const imageUrl = event.imageUrl?.startsWith('http')
                                        ? event.imageUrl
                                        : event.imageUrl
                                            ? `${apiUrl}${event.imageUrl}`
                                            : 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=600';

                                    return (
                                        <div key={event.id} style={{
                                            background: 'rgba(0,0,0,0.6)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(0,240,255,0.1)',
                                            transition: 'all 0.3s',
                                            position: 'relative'
                                        }}>
                                            {/* Image Container */}
                                            <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                                                <img
                                                    src={imageUrl}
                                                    alt={event.title || event.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                {/* Category Badge */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '0.75rem',
                                                    left: '0.75rem',
                                                    background: 'rgba(0,240,255,0.9)',
                                                    color: 'black',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 900,
                                                    letterSpacing: '0.1em',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {RACE_CATEGORY_LABELS[event.category] || event.categoryLabel || 'RACE'}
                                                </div>
                                                {/* Date Badge */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '0.75rem',
                                                    right: '0.75rem',
                                                    background: 'rgba(112,0,255,0.9)',
                                                    color: 'white',
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem'
                                                }}>
                                                    <Clock size={14} /> {new Date(event.start_time || event.startTime).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </div>
                                                {/* Gradient Overlay */}
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '80px',
                                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
                                                }}></div>
                                            </div>

                                            {/* Content */}
                                            <div style={{ padding: '1.25rem' }}>
                                                {/* Title */}
                                                <h3 style={{
                                                    fontSize: '1.125rem',
                                                    fontWeight: 700,
                                                    marginBottom: '0.75rem',
                                                    lineHeight: 1.3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {event.title || event.name}
                                                </h3>

                                                {/* Location */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.8rem',
                                                    color: 'rgba(255,255,255,0.6)',
                                                    marginBottom: '1rem'
                                                }}>
                                                    <MapPin size={14} style={{ color: '#00F0FF' }} />
                                                    {event.location || 'TBA'}
                                                </div>

                                                {/* Countdown */}
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '0.5rem',
                                                    marginBottom: '1rem'
                                                }}>
                                                    {[
                                                        { value: countdown.days, label: 'H' },
                                                        { value: countdown.hours, label: 'J' },
                                                        { value: countdown.minutes, label: 'M' },
                                                        { value: countdown.seconds, label: 'D' }
                                                    ].map((item, idx) => (
                                                        <div key={idx} style={{
                                                            flex: 1,
                                                            background: 'rgba(0,240,255,0.05)',
                                                            border: '1px solid rgba(0,240,255,0.2)',
                                                            borderRadius: '8px',
                                                            padding: '0.5rem',
                                                            textAlign: 'center'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '1.25rem',
                                                                fontWeight: 900,
                                                                color: '#00F0FF',
                                                                fontFamily: "'Orbitron', monospace"
                                                            }}>
                                                                {String(item.value).padStart(2, '0')}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '0.55rem',
                                                                color: 'rgba(255,255,255,0.4)',
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                {item.label}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Action Buttons */}
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <button
                                                        onClick={() => handleOpenLightbox(event, imageUrl)}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '0.5rem',
                                                            background: 'linear-gradient(135deg, #7000FF, #5000CC)',
                                                            color: 'white',
                                                            padding: '0.75rem',
                                                            borderRadius: '8px',
                                                            fontWeight: 700,
                                                            fontSize: '0.8rem',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            textTransform: 'uppercase',
                                                            transition: 'all 0.3s'
                                                        }}
                                                    >
                                                        <Search size={16} /> Lihat Gambar
                                                    </button>
                                                    {event.external_link && (
                                                        <a
                                                            href={event.external_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                background: 'rgba(57,255,20,0.1)',
                                                                border: '1px solid rgba(57,255,20,0.3)',
                                                                color: '#39FF14',
                                                                padding: '0.75rem 1rem',
                                                                borderRadius: '8px',
                                                                fontSize: '0.8rem',
                                                                textDecoration: 'none'
                                                            }}
                                                        >
                                                            <Link2 size={16} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Empty State */
                            <div style={{
                                textAlign: 'center',
                                padding: '5rem 0',
                                color: 'rgba(255,255,255,0.3)'
                            }}>
                                <div style={{ fontSize: '5rem', marginBottom: '1rem', opacity: 0.3 }}><Flag size={80} /></div>
                                <h3 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.4)',
                                    marginBottom: '0.5rem',
                                    fontFamily: "'Orbitron', sans-serif"
                                }}>
                                    No Upcoming Races
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)' }}>
                                    The engines are cooling down.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}


            {/* EVENTS SECTION - Only show when events exist */}
            {events.length > 0 && (
                <section id="events" style={{ padding: '6rem 0' }}>
                    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            marginBottom: '3rem'
                        }}>
                            <div>
                                <h2 style={{
                                    fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                                    fontWeight: 900,
                                    fontStyle: 'italic',
                                    fontFamily: "'Archivo Black', sans-serif"
                                }}>
                                    EVENT <span style={{ color: '#39FF14' }}>TERBARU</span>
                                </h2>
                                <div style={{ height: '4px', width: '5rem', background: '#39FF14', marginTop: '0.5rem' }}></div>
                            </div>
                            <a href="#events" style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'rgba(255,255,255,0.5)',
                                textDecoration: 'underline',
                                letterSpacing: '0.1em'
                            }}>
                                LIHAT SEMUA
                            </a>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '2rem'
                        }}>
                            {events.map((event: any) => (
                                <Link
                                    key={event._id || event.id}
                                    to={`/event/${event._id || event.id}`}
                                    className="card"
                                >
                                    <div style={{ position: 'relative', height: '16rem', overflow: 'hidden' }}>
                                        <img
                                            src={event.imageUrl || event.image}
                                            alt={event.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s'
                                            }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            left: '1rem',
                                            background: 'rgba(0,0,0,0.8)',
                                            padding: '0.25rem 0.75rem',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            letterSpacing: '-0.02em',
                                            border: '1px solid #39FF14',
                                            color: '#39FF14'
                                        }}>
                                            ROAD RACE
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            marginBottom: '0.5rem'
                                        }}>{event.name}</h3>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'rgba(255,255,255,0.5)',
                                            marginBottom: '1rem'
                                        }}>
                                            <MapPin size={12} /> {event.location}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                color: 'rgba(255,255,255,0.4)',
                                                textTransform: 'uppercase'
                                            }}>
                                                {event.date}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: '#39FF14'
                                            }}>
                                                LIHAT GALERI <ArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* LAYANAN & HARGA SECTION */}
            <section id="layanan" style={{
                padding: '5rem 0',
                background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)',
                borderTop: '1px solid rgba(255,255,255,0.06)'
            }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <p style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: 900,
                            color: '#39FF14',
                            letterSpacing: '0.2em',
                            marginBottom: '0.5rem'
                        }}>
                            <Wallet size={12} /> Produk & Layanan
                        </p>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                            fontWeight: 900,
                            fontStyle: 'italic',
                            fontFamily: "'Archivo Black', sans-serif"
                        }}>
                            LAYANAN & <span style={{ color: '#39FF14' }}>HARGA</span>
                        </h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: '0.75rem',
                            maxWidth: '600px',
                            margin: '0.75rem auto 0',
                            fontSize: '0.9rem',
                            lineHeight: 1.6
                        }}>
                            Kami menyediakan layanan foto balapan profesional dengan harga terjangkau. Pilih layanan yang sesuai kebutuhanmu.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.5rem',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}>
                        {/* Card 1: Foto Satuan */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            padding: '2rem',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(90deg, #39FF14, #00f0ff)'
                            }}></div>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '12px',
                                background: 'rgba(57,255,20,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.25rem'
                            }}>
                                <Camera size={24} style={{ color: '#39FF14' }} />
                            </div>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>Foto Aksi Satuan</h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.85rem',
                                lineHeight: 1.6,
                                marginBottom: '1.5rem'
                            }}>
                                Beli foto aksi balapan resolusi tinggi per lembar. Pilih sendiri foto terbaikmu dari katalog event.
                            </p>
                            <div style={{
                                background: 'rgba(57,255,20,0.08)',
                                borderRadius: '10px',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ fontSize: '0.7rem', color: '#39FF14', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Harga mulai</p>
                                <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white' }}>Rp 15.000 <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>/ foto</span></p>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                                {['Resolusi tinggi (Full HD/4K)', 'Tanpa watermark', 'Download langsung via email', 'Bayar via QRIS / E-Wallet'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', padding: '0.35rem 0' }}>
                                        <Check size={14} style={{ color: '#39FF14' }} /> {item}
                                    </li>
                                ))}
                            </ul>
                            <a href="#events" style={{
                                display: 'block',
                                textAlign: 'center',
                                background: '#39FF14',
                                color: '#000',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transition: 'all 0.3s'
                            }}>LIHAT KATALOG <ArrowRight size={14} /></a>
                        </div>

                        {/* Card 2: Paket Lengkap */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '2px solid rgba(57,255,20,0.3)',
                            borderRadius: '16px',
                            padding: '2rem',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 0 30px rgba(57,255,20,0.05)'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: '#39FF14',
                                color: '#000',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase'
                            }}>POPULER</div>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(90deg, #39FF14, #a855f7, #00f0ff)'
                            }}></div>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '12px',
                                background: 'rgba(57,255,20,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.25rem'
                            }}>
                                <CreditCard size={24} style={{ color: '#39FF14' }} />
                            </div>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>Paket Hemat</h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.85rem',
                                lineHeight: 1.6,
                                marginBottom: '1.5rem'
                            }}>
                                Dapatkan semua foto dari satu event dengan harga spesial. Hubungi kami via WhatsApp untuk penawaran custom.
                            </p>
                            <div style={{
                                background: 'rgba(57,255,20,0.08)',
                                borderRadius: '10px',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ fontSize: '0.7rem', color: '#39FF14', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Harga paket</p>
                                <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white' }}>Custom <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>/ event</span></p>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                                {['Semua foto dalam satu event', 'Diskon hingga 50%', 'Resolusi tertinggi', 'Konsultasi via WhatsApp'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', padding: '0.35rem 0' }}>
                                        <Check size={14} style={{ color: '#39FF14' }} /> {item}
                                    </li>
                                ))}
                            </ul>
                            <a href="https://wa.me/6287780085484?text=Halo%20GeezPlay%2C%20saya%20tertarik%20paket%20foto%20event" target="_blank" rel="noopener noreferrer" style={{
                                display: 'block',
                                textAlign: 'center',
                                background: '#39FF14',
                                color: '#000',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transition: 'all 0.3s'
                            }}>HUBUNGI VIA WHATSAPP <ArrowRight size={14} /></a>
                        </div>

                        {/* Card 3: Booking Fotografer */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            padding: '2rem',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(90deg, #00f0ff, #a855f7)'
                            }}></div>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '12px',
                                background: 'rgba(0,240,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.25rem'
                            }}>
                                <Users size={24} style={{ color: '#00f0ff' }} />
                            </div>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>Booking Fotografer</h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.85rem',
                                lineHeight: 1.6,
                                marginBottom: '1.5rem'
                            }}>
                                Sewa fotografer profesional khusus untuk event atau tim balapanmu. Cakupan lengkap dari start hingga finish.
                            </p>
                            <div style={{
                                background: 'rgba(0,240,255,0.08)',
                                borderRadius: '10px',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ fontSize: '0.7rem', color: '#00f0ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Harga mulai</p>
                                <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white' }}>Rp 500.000 <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>/ event</span></p>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0' }}>
                                {['Fotografer profesional berpengalaman', 'Kamera high-speed DSLR/Mirrorless', 'Editing profesional', 'Hasil dalam 3-5 hari kerja'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', padding: '0.35rem 0' }}>
                                        <Check size={14} style={{ color: '#00f0ff' }} /> {item}
                                    </li>
                                ))}
                            </ul>
                            <a href="#booking" style={{
                                display: 'block',
                                textAlign: 'center',
                                background: 'transparent',
                                color: '#00f0ff',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                border: '1px solid #00f0ff',
                                transition: 'all 0.3s'
                            }}>BOOKING SEKARANG <ArrowRight size={14} /></a>
                        </div>
                    </div>

                    {/* Payment Methods Info */}
                    <div style={{
                        textAlign: 'center',
                        marginTop: '3rem',
                        padding: '1.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        maxWidth: '600px',
                        margin: '3rem auto 0'
                    }}>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Metode Pembayaran</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                            {['QRIS', 'OVO', 'GoPay', 'ShopeePay', 'DANA', 'Bank Transfer'].map((method, i) => (
                                <span key={i} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{method}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* PHOTOGRAPHERS SECTION */}
            {photographers && photographers.length > 0 && (
                <section id="photographers" style={{ padding: '5rem 0', background: '#020202' }}>
                    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                            fontWeight: 900,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            marginBottom: '3rem',
                            color: '#39FF14',
                            fontFamily: "'Archivo Black', sans-serif"
                        }}>
                            FOTOGRAFER KAMI
                        </h2>
                        <div style={{ position: 'relative' }}>
                            <div id="photographer-scroll" className="scrollbar-hide" style={{
                                display: 'flex',
                                gap: '1rem',
                                overflowX: 'auto',
                                padding: '0.5rem 3rem',
                                scrollSnapType: 'x mandatory'
                            }}>
                                {photographers.map((photographer: any, index: number) => (
                                    <div key={photographer._id || photographer.id} style={{
                                        flexShrink: 0,
                                        width: '20rem',
                                        scrollSnapAlign: 'center'
                                    }}>
                                        <div
                                            style={{
                                                position: 'relative',
                                                overflow: 'hidden',
                                                borderRadius: '1rem',
                                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                                aspectRatio: '3/4',
                                                background: `linear-gradient(135deg, ${photographer.gradientFrom || photographer.gradient_from || '#1a1a1a'}, ${photographer.gradientTo || photographer.gradient_to || '#0a0a0a'})`
                                            }}
                                        >
                                            {(photographer.photoUrl || photographer.photo) && (
                                                <img
                                                    src={photographer.photoUrl || photographer.photo}
                                                    alt={photographer.name}
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        objectPosition: 'top'
                                                    }}
                                                />
                                            )}
                                            <div style={{
                                                position: 'absolute',
                                                top: '1rem',
                                                right: '1rem',
                                                zIndex: 10,
                                                fontSize: '3rem',
                                                fontWeight: 900,
                                                color: 'rgba(255,255,255,0.8)',
                                                lineHeight: 1,
                                                textShadow: '2px 2px 10px rgba(0,0,0,0.5)',
                                                fontFamily: "'Archivo Black', sans-serif"
                                            }}>
                                                {String(index + 1).padStart(2, '0')}
                                            </div>
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: '40%',
                                                background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.7), transparent)'
                                            }}></div>
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: '1rem',
                                                zIndex: 10
                                            }}>
                                                {photographer.category && (
                                                    <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                                                        {photographer.category}
                                                    </span>
                                                )}
                                                <h3 style={{
                                                    fontSize: '1.25rem',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    color: 'white',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                                    lineHeight: 1.2,
                                                    letterSpacing: '-0.02em'
                                                }}>
                                                    {photographer.name}
                                                </h3>
                                                {photographer.team && (
                                                    <p style={{
                                                        fontSize: '0.75rem',
                                                        color: 'rgba(255,255,255,0.7)',
                                                        marginTop: '0.25rem',
                                                        fontWeight: 500
                                                    }}>
                                                        {photographer.team}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* WORKFLOW SECTION */}
            <section id="workflow" style={{ padding: '6rem 0', background: '#0a0a0a' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                            fontWeight: 900,
                            fontStyle: 'italic',
                            fontFamily: "'Archivo Black', sans-serif"
                        }}>
                            CARA <span style={{ color: '#39FF14' }}>KERJA</span>
                        </h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontSize: '0.75rem'
                        }}>
                            PROSES CEPAT TANPA RIBET
                        </p>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '2rem'
                    }}>
                        {[
                            { num: '01', title: 'Pilih Event', desc: 'Temukan balapan yang kamu ikuti dari daftar event kami.' },
                            { num: '02', title: 'Cari Nomor', desc: 'Masukkan nama event untuk filter instan.' },
                            { num: '03', title: 'Bayar Instant', desc: 'Pilih foto terbaikmu dan bayar via QRIS/E-Wallet.' },
                            { num: '04', title: 'Terima Foto', desc: 'Link download resolusi tinggi dikirim langsung via Email.' },
                        ].map(step => (
                            <div key={step.num} style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '5rem',
                                    height: '5rem',
                                    margin: '0 auto 1.5rem',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, rgba(57,255,20,0.2), transparent)',
                                    border: '2px solid rgba(57,255,20,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s'
                                }}>
                                    <span style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 900,
                                        color: '#39FF14'
                                    }}>{step.num}</span>
                                </div>
                                <h4 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 700,
                                    marginBottom: '0.5rem'
                                }}>{step.title}</h4>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'rgba(255,255,255,0.5)',
                                    lineHeight: 1.6
                                }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DIRECT BOOKING SECTION */}
            <section id="booking" style={{
                padding: '6rem 0',
                background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050505 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decoration */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.05) 0%, transparent 60%)',
                    pointerEvents: 'none'
                }}></div>

                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', position: 'relative', zIndex: 10 }}>
                    {/* Hero Headline */}
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                            fontWeight: 900,
                            fontStyle: 'italic',
                            lineHeight: 1.1,
                            marginBottom: '1rem',
                            fontFamily: "'Archivo Black', sans-serif"
                        }}>
                            <span style={{ color: '#00F0FF' }}>ABADIKAN</span> MOMEN<br />
                            TERCEPAT<span style={{ color: '#39FF14' }}> KAMU</span>
                        </h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '1.125rem',
                            maxWidth: '600px',
                            margin: '0 auto 2.5rem',
                            lineHeight: 1.7
                        }}>
                            Hubungi kami langsung untuk booking foto balap profesional.
                            Proses cepat, hasil berkualitas tinggi.
                        </p>

                        {/* Dual CTA Buttons */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '1rem',
                            marginBottom: '4rem'
                        }}>
                            <a
                                href="https://wa.me/+6287780085484?text=Halo%2C%20saya%20ingin%20pesan%20foto%20untuk%20event"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                                    color: 'white',
                                    padding: '1rem 2.5rem',
                                    borderRadius: '9999px',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    textDecoration: 'none',
                                    boxShadow: '0 10px 40px rgba(37,211,102,0.3)',
                                    transition: 'all 0.3s',
                                    border: 'none'
                                }}
                            >
                                <Smartphone size={24} />
                                WhatsApp Kami
                            </a>
                            <a
                                href="https://instagram.com/geezplay"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    padding: '1rem 2.5rem',
                                    borderRadius: '9999px',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <Camera size={24} />
                                Instagram Kami
                            </a>
                        </div>
                    </div>

                    {/* Value Proposition Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.5rem',
                        marginTop: '2rem'
                    }}>
                        {[
                            {
                                icon: Target,
                                title: 'Kualitas Terbaik',
                                desc: ' hasil profesional dengan kualitas terbaik untuk hasil tajam dan detail maksimal.',
                                color: '#00F0FF'
                            },
                            {
                                icon: Zap,
                                title: 'Pengiriman Cepat',
                                desc: '  foto final dikirim dalam 2x24 jam.',
                                color: '#39FF14'
                            },
                            {
                                icon: Sparkles,
                                title: 'Booking Mudah',
                                desc: 'Tidak perlu registrasi. Langsung chat via WhatsApp, deal, dan foto!',
                                color: '#7000FF'
                            }
                        ].map((item, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(255,255,255,0.02)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '16px',
                                padding: '2rem',
                                textAlign: 'center',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{
                                    width: '4rem',
                                    height: '4rem',
                                    margin: '0 auto 1.5rem',
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${item.color}20, transparent)`,
                                    border: `2px solid ${item.color}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <item.icon size={28} style={{ color: item.color }} />
                                </div>
                                <h4 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    marginBottom: '0.75rem',
                                    color: item.color
                                }}>
                                    {item.title}
                                </h4>
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255,255,255,0.5)',
                                    lineHeight: 1.6
                                }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SPONSORS SECTION */}
            {sponsors && Object.keys(sponsors).length > 0 && (
                <section id="sponsors" style={{ padding: '5rem 0', background: '#111111' }}>
                    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                            fontWeight: 900,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            marginBottom: '3rem',
                            fontFamily: "'Archivo Black', sans-serif"
                        }}>
                            OUR <span style={{ color: '#39FF14' }}>SPONSORS</span>
                        </h2>
                        {Object.entries(sponsors as Record<string, any[]>).map(([categoryKey, categorySponsors]) => {
                            if (!categorySponsors || categorySponsors.length === 0) return null;
                            const categoryLabel = CATEGORY_LABELS[categoryKey] || categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);

                            return (
                                <div key={categoryKey} style={{ marginBottom: '3rem' }}>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: 'rgba(255,255,255,0.5)',
                                        textAlign: 'center',
                                        marginBottom: '2rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em'
                                    }}>
                                        {categoryLabel}
                                    </h3>
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '2rem'
                                    }}>
                                        {categorySponsors.map((sponsor: any) => (
                                            <div key={sponsor._id || sponsor.id} style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '1rem',
                                                padding: '1.5rem 2rem',
                                                transition: 'all 0.2s',
                                                minWidth: '150px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {(sponsor.logo_url || sponsor.logoUrl) ? (
                                                    <img
                                                        src={sponsor.logo_url || sponsor.logoUrl}
                                                        alt={sponsor.name}
                                                        style={{
                                                            maxHeight: '80px',
                                                            maxWidth: '200px',
                                                            width: 'auto',
                                                            height: 'auto',
                                                            objectFit: 'contain'
                                                        }}
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                            (e.target as HTMLElement).parentElement!.querySelector('span')!.style.display = 'block';
                                                        }}
                                                    />
                                                ) : null}
                                                <span style={{
                                                    display: (sponsor.logo_url || sponsor.logoUrl) ? 'none' : 'block',
                                                    color: 'rgba(255,255,255,0.7)',
                                                    fontWeight: 700,
                                                    fontSize: '1rem'
                                                }}>
                                                    {sponsor.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* SUPPORT */}
            <section id="support" style={{
                background: '#050505',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '4rem 0'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '0 1rem'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <p style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: 900,
                            color: '#39FF14',
                            letterSpacing: '0.2em',
                            marginBottom: '0.5rem'
                        }}>
                            <MessageCircle size={12} /> Bantuan & Dukungan
                        </p>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            fontStyle: 'italic',
                            letterSpacing: '-0.02em'
                        }}>
                            Hubungi <span style={{ color: '#39FF14' }}>Kami</span>
                        </h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.25rem',
                        maxWidth: '900px',
                        margin: '0 auto'
                    }}>
                        {/* Alamat */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            transition: 'border-color 0.3s ease'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(57,255,20,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                marginBottom: '1rem'
                            }}><MapPin size={20} style={{ color: '#39FF14' }} /></div>
                            <p style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: 800,
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '0.5rem'
                            }}>Alamat</p>
                            <p style={{
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '0.85rem',
                                lineHeight: '1.6'
                            }}>
                                Jl. Dahlia RT04/RW02, Desa Koto Ringin,
                                <br />Kecamatan Mempura, Kabupaten Siak,
                                <br />Provinsi Riau
                            </p>
                        </div>

                        {/* WhatsApp */}
                        <a href="https://wa.me/6287780085484" target="_blank" rel="noopener noreferrer" style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            textDecoration: 'none',
                            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                            display: 'block'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(37,211,102,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                marginBottom: '1rem'
                            }}><Smartphone size={20} /></div>
                            <p style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: 800,
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '0.5rem'
                            }}>WhatsApp</p>
                            <p style={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '1rem',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                letterSpacing: '0.05em'
                            }}>
                                0877-8008-5484
                            </p>
                        </a>

                        {/* Email */}
                        <a href="mailto:2jzgte144@gmail.com" style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            textDecoration: 'none',
                            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                            display: 'block'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'rgba(57,255,20,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                marginBottom: '1rem'
                            }}><Mail size={20} /></div>
                            <p style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: 800,
                                color: '#39FF14',
                                letterSpacing: '0.1em',
                                marginBottom: '0.5rem'
                            }}>Email</p>
                            <p style={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '1rem',
                                fontWeight: 700
                            }}>
                                2jzgte144@gmail.com
                            </p>
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{
                background: '#020202',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                padding: '4rem 0 2rem'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '0 1rem'
                }}>
                    {/* Footer Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '2.5rem',
                        marginBottom: '3rem'
                    }}>
                        {/* Column 1: Brand */}
                        <div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                fontFamily: "'Archivo Black', sans-serif",
                                marginBottom: '1rem'
                            }}>
                                Geez<span style={{ color: '#39FF14' }}>Play</span>
                            </div>
                            <p style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.85rem',
                                lineHeight: 1.7,
                                marginBottom: '1.25rem'
                            }}>
                                Platform foto aksi balapan motor dan mobil profesional di Indonesia. Temukan foto terbaikmu dari berbagai event balap.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <a href="https://www.instagram.com/geezplay/" target="_blank" rel="noopener noreferrer" style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.6)',
                                    textDecoration: 'none',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s'
                                }}><Camera size={16} /></a>
                                <a href="https://wa.me/6287780085484" target="_blank" rel="noopener noreferrer" style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.6)',
                                    textDecoration: 'none',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s'
                                }}><Smartphone size={16} /></a>
                                <a href="mailto:2jzgte144@gmail.com" style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.6)',
                                    textDecoration: 'none',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s'
                                }}><Mail size={16} /></a>
                            </div>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div>
                            <h4 style={{
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#39FF14',
                                marginBottom: '1.25rem'
                            }}>Navigasi</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                    { href: '#events', label: 'Event & Katalog' },
                                    { href: '#layanan', label: 'Layanan & Harga' },
                                    { href: '#workflow', label: 'Cara Kerja' },
                                    { href: '#booking', label: 'Booking Fotografer' },
                                    { href: '#support', label: 'Hubungi Kami' }
                                ].map((link, i) => (
                                    <a key={i} href={link.href} style={{
                                        color: 'rgba(255,255,255,0.5)',
                                        textDecoration: 'none',
                                        fontSize: '0.85rem',
                                        transition: 'color 0.2s'
                                    }}>{link.label}</a>
                                ))}
                            </div>
                        </div>

                        {/* Column 3: Contact */}
                        <div>
                            <h4 style={{
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#39FF14',
                                marginBottom: '1.25rem'
                            }}>Kontak</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Alamat</p>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                        Jl. Dahlia RT04/RW02, Desa Koto Ringin, Kec. Mempura, Kab. Siak, Riau
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>WhatsApp</p>
                                    <a href="https://wa.me/6287780085484" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'monospace' }}>0877-8008-5484</a>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Email</p>
                                    <a href="mailto:2jzgte144@gmail.com" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem' }}>2jzgte144@gmail.com</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        paddingTop: '1.5rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                            © 2024 RACEPHOTO by GeezPlay. All rights reserved.
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                            Platform foto balapan profesional Indonesia
                        </p>
                    </div>
                </div>
            </footer>

            {/* Image Lightbox Modal */}
            {selectedEvent && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }} onClick={handleCloseLightbox}>
                    {/* Top Bar */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem 1.5rem',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)'
                    }} onClick={e => e.stopPropagation()}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                {selectedEvent.title || selectedEvent.name}
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                <MapPin size={14} /> {selectedEvent.location || 'TBA'} • <CalendarDays size={14} /> {new Date(selectedEvent.start_time || selectedEvent.startTime).toLocaleDateString('id-ID')}
                            </p>
                        </div>
                        <button onClick={handleCloseLightbox} style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <X size={24} />
                        </button>
                    </div>

                    {/* Image Container */}
                    <div style={{
                        maxWidth: '90vw',
                        maxHeight: '75vh',
                        overflow: 'auto',
                        borderRadius: '12px'
                    }} onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedEvent.fullImageUrl}
                            alt={selectedEvent.title || selectedEvent.name}
                            style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'center',
                                transition: 'transform 0.3s ease',
                                maxWidth: '100%',
                                borderRadius: '12px',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                            }}
                        />
                    </div>

                    {/* Bottom Controls */}
                    <div style={{
                        position: 'absolute',
                        bottom: '2rem',
                        display: 'flex',
                        gap: '0.75rem',
                        background: 'rgba(0,0,0,0.8)',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '9999px',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <button onClick={handleZoomOut} style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.25rem',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            cursor: 'pointer'
                        }} title="Zoom Out">
                            <Minus size={20} />
                        </button>
                        <button onClick={handleResetZoom} style={{
                            background: 'rgba(0,240,255,0.2)',
                            border: '1px solid rgba(0,240,255,0.4)',
                            color: '#00F0FF',
                            fontSize: '0.8rem',
                            padding: '0 1rem',
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            fontWeight: 700
                        }}>
                            {Math.round(zoomLevel * 100)}%
                        </button>
                        <button onClick={handleZoomIn} style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.25rem',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            cursor: 'pointer'
                        }} title="Zoom In">
                            <Plus size={20} />
                        </button>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 0.5rem' }}></div>
                        <button onClick={handleDownload} style={{
                            background: 'linear-gradient(135deg, #39FF14, #32CD32)',
                            border: 'none',
                            color: 'black',
                            fontSize: '0.85rem',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Download size={16} /> Download
                        </button>
                    </div>
                </div>
            )}

            {/* Floating WhatsApp FAB */}
            <a
                href="https://wa.me/+6287780085484?text=Halo%2C%20saya%20ingin%20booking%20foto%20untuk%20event"
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-fab"
                style={{
                    position: 'fixed',
                    bottom: '1rem',
                    right: '1rem',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    color: 'white',
                    padding: '0.625rem 1rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    boxShadow: '0 6px 20px rgba(37,211,102,0.4)',
                    transition: 'all 0.3s'
                }}
            >
                <Smartphone size={16} />
                <span className="whatsapp-text">WhatsApp</span>
            </a>
        </div>
    );
}
