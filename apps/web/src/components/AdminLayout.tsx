import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSettings } from '../services/api';
import {
    Home,
    ShoppingCart,
    Wallet,
    FolderDown,
    Camera,
    Users,
    Settings,
    Clock,
    Upload,
    UserCog,
    LogOut,
    User,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Image,
    CalendarDays,
    Tag,
    MoreHorizontal
} from 'lucide-react';

export default function AdminLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isSuperAdmin } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
    const [isMobile, setIsMobile] = useState(false);
    const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
    const [siteSettings, setSiteSettings] = useState<{ site_name: string; logo_url: string | null }>({ site_name: 'RacePhoto', logo_url: null });

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close sidebar when navigating on mobile
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await getSettings();
                if (res.data) {
                    setSiteSettings({
                        site_name: res.data.site_name || 'RacePhoto',
                        logo_url: res.data.logo_url || null
                    });
                }
            } catch (error: any) {
                console.error('Error fetching site settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    // Menu items based on role
    const menuItems = [
        { name: 'Dashboard', icon: Home, href: '/admin', active: isActive('/admin') },
        { name: 'Event & Foto', icon: CalendarDays, href: '/admin/event-manager', active: isActive('/admin/event-manager') },
        { name: 'Transaksi', icon: ShoppingCart, href: '/admin/transactions', active: isActive('/admin/transactions') },
        { name: 'Recap Foto', icon: FolderDown, href: '/admin/recap', active: isActive('/admin/recap') },
        // Regular admin only
        ...(!isSuperAdmin() ? [
            { name: 'Saldo & Penarikan', icon: Wallet, href: '/admin/balance', active: isActive('/admin/balance') },
        ] : []),
        // Super admin only
        ...(isSuperAdmin() ? [
            { name: 'Event Calendar', icon: CalendarDays, href: '/admin/upcoming-events', active: isActive('/admin/upcoming-events') },
            { name: 'Fotografer', icon: Camera, href: '/admin/photographers', active: isActive('/admin/photographers') },
            { name: 'Sponsor', icon: Users, href: '/admin/sponsors', active: isActive('/admin/sponsors') },
            { name: 'Pengaturan', icon: Settings, href: '/admin/settings', active: isActive('/admin/settings') },
            { name: 'Pending Events', icon: Clock, href: '/admin/pending-events', active: isActive('/admin/pending-events') },
            { name: 'Request Penarikan', icon: Upload, href: '/admin/withdrawals', active: isActive('/admin/withdrawals') },
            { name: 'Kelola Admin', icon: UserCog, href: '/admin/users', active: isActive('/admin/users') },
            { name: 'Diskon', icon: Tag, href: '/admin/discounts', active: isActive('/admin/discounts') },
        ] : []),
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: '#020202',
            color: 'white',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        zIndex: 35
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                position: 'fixed',
                top: 0,
                left: isMobile && !sidebarOpen ? '-260px' : 0,
                height: '100%',
                width: isMobile ? '260px' : (sidebarOpen ? '256px' : '80px'),
                background: '#0a0a0a',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                zIndex: 40,
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Logo */}
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    {siteSettings.logo_url ? (
                        <img
                            src={siteSettings.logo_url.startsWith('http') ? siteSettings.logo_url : `${import.meta.env.VITE_API_URL || 'https://api.geezplay.site'}${siteSettings.logo_url}`}
                            alt={siteSettings.site_name}
                            style={{
                                height: '40px',
                                width: 'auto',
                                maxWidth: sidebarOpen ? '180px' : '40px',
                                objectFit: 'contain'
                            }}
                        />
                    ) : (
                        <>
                            <div style={{
                                background: '#39FF14',
                                padding: '0.5rem',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Image size={24} color="black" />
                            </div>
                            {sidebarOpen && (
                                <div>
                                    <h1 style={{
                                        fontWeight: '900',
                                        fontSize: '1.125rem',
                                        letterSpacing: '-0.02em',
                                        textTransform: 'uppercase',
                                        fontStyle: 'italic'
                                    }}>{siteSettings.site_name}</h1>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Admin Panel</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Menu */}
                <nav style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                    <p style={{
                        fontSize: '10px',
                        fontWeight: '900',
                        color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '1rem',
                        textAlign: sidebarOpen ? 'left' : 'center'
                    }}>
                        {sidebarOpen ? 'Menu' : <MoreHorizontal size={20} />}
                    </p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {menuItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '12px',
                                            transition: 'all 0.2s',
                                            textDecoration: 'none',
                                            background: item.active ? '#39FF14' : 'transparent',
                                            color: item.active ? 'black' : 'rgba(255,255,255,0.6)',
                                            fontWeight: item.active ? '700' : '500'
                                        }}
                                    >
                                        <IconComponent size={20} />
                                        {sidebarOpen && <span>{item.name}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    style={{
                        position: 'absolute',
                        right: '-12px',
                        top: '80px',
                        background: '#39FF14',
                        color: 'black',
                        border: 'none',
                        padding: '0.375rem',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* User Profile */}
                <div style={{
                    padding: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <div style={{
                        background: 'rgba(57,255,20,0.2)',
                        padding: '0.5rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <User size={20} color="#39FF14" />
                    </div>
                    {sidebarOpen && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: '700', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.name || 'Admin'}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.email}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                marginLeft: isMobile ? 0 : (sidebarOpen ? '256px' : '80px'),
                transition: 'margin-left 0.3s'
            }}>
                {/* Top Header */}
                <header style={{
                    background: 'rgba(10,10,10,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    {/* Hamburger Menu Button (Mobile) */}
                    {isMobile && (
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{
                                background: 'rgba(57,255,20,0.1)',
                                border: '1px solid rgba(57,255,20,0.3)',
                                color: '#39FF14',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{
                            fontSize: isMobile ? '1rem' : '1.875rem',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            fontStyle: 'italic',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {title || 'Control Panel'}
                        </h2>
                        {!isMobile && (
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>
                                {subtitle || `Selamat datang kembali, ${user?.name || 'Admin'}!`}
                            </p>
                        )}
                    </div>
                    <Link
                        to="/"
                        style={{
                            color: 'rgba(255,255,255,0.4)',
                            textDecoration: 'none',
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            padding: isMobile ? '0.375rem 0.625rem' : '0.5rem 1rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                    >
                        {isMobile ? <ExternalLink size={14} /> : <>Lihat Website <ExternalLink size={14} /></>}
                    </Link>
                </header>

                {/* Page Content */}
                <div style={{ padding: '1.5rem' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
