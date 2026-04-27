import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import logo from '/assets/furnix-logo.png';
import { getWhatsAppNumber } from '../../utils/siteSettings';
import WhatsAppLoginModal from '../auth/WhatsAppLoginModal';

const Navbar = ({ rightContent }) => {
    const location = useLocation();
    const { user } = useAuth();
    const { settings } = useSiteSettings();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const whatsappNumber = getWhatsAppNumber(settings);

    const isActive = (path) => {
        if (path.includes('#')) {
            const [p, hash] = path.split('#');
            return location.pathname === (p || '/') && location.hash === `#${hash}`;
        }
        if (path === '/') return location.pathname === '/' && !location.hash;
        return location.pathname.startsWith(path);
    };

    const initials = (user?.fullName || user?.username || 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'U';

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    const handleWhatsAppClick = (e) => {
        if (!user) {
            e.preventDefault();
            setShowWhatsAppModal(true);
        }
    };

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm transition-all duration-300">
                <div className="flex justify-between items-center w-full px-4 md:px-8 py-3 md:py-4 max-w-screen-2xl mx-auto">
                    {/* Left: Brand - Increased Size */}
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300">
                        <img src={logo} alt="Furnix" className="h-20 md:h-25 w-auto object-contain" />
                    </Link>

                    {/* Center: Primary Links */}
                    <div className="hidden lg:flex items-center justify-center gap-8 font-body tracking-tight text-[13px] uppercase font-bold">
                        <Link
                            to="/gallery"
                            className={`transition-colors duration-300 ${
                                isActive('/gallery')
                                    ? 'text-primary border-b-2 border-primary pb-1'
                                    : 'text-on-surface-variant hover:text-primary'
                            }`}
                        >
                            Gallery
                        </Link>
                        <Link
                            to="/#collection"
                            className={`transition-colors duration-300 ${
                                isActive('/#collection')
                                    ? 'text-primary border-b-2 border-primary pb-1'
                                    : 'text-on-surface-variant hover:text-primary'
                            }`}
                        >
                            Collection
                        </Link>

                        <Link
                            to="/track-order"
                            className={`transition-colors duration-300 ${
                                isActive('/track-order')
                                    ? 'text-primary border-b-2 border-primary pb-1'
                                    : 'text-on-surface-variant hover:text-primary'
                            }`}
                        >
                            Track Order
                        </Link>

                        <Link
                            to="/order"
                            className={`rounded-full px-6 py-2.5 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                                isActive('/order')
                                    ? 'bg-primary text-on-primary shadow-xl shadow-primary/40 ring-2 ring-primary/50 ring-offset-2'
                                    : 'bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-xl'
                            }`}
                        >
                            Custom Order
                        </Link>

                        <Link
                            to="/contact"
                            className={`transition-colors duration-300 ${
                                isActive('/contact')
                                    ? 'text-primary border-b-2 border-primary pb-1'
                                    : 'text-on-surface-variant hover:text-primary'
                            }`}
                        >
                            Contact
                        </Link>
                    </div>

                    {/* Right: Icons / Extras */}
                    <div className="flex items-center gap-5 text-on-surface">
                        {/* WhatsApp - Original Green Color */}
                        <a
                            href={user ? `https://wa.me/${whatsappNumber}` : '#'}
                            target={user ? "_blank" : undefined}
                            rel={user ? "noreferrer" : undefined}
                            onClick={handleWhatsAppClick}
                            className="hidden md:inline-flex items-center rounded-full border-2 border-[#25D366] px-5 py-2 text-[12px] font-extrabold uppercase tracking-widest text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            WhatsApp {user ? 'Chat' : 'Login'}
                        </a>
                        {rightContent}
                        {user ? (
                            <Link to={user.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/account'} className="hover:opacity-80 transition-opacity duration-300 scale-95 ease-out p-1 rounded-full hover:bg-surface-container-low" aria-label="account_circle">
                                {user.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt={user.fullName || user.username}
                                        className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                                    />
                                ) : (
                                    <span className="inline-flex h-10 w-10 rounded-full items-center justify-center bg-primary-container text-on-primary-container text-[12px] font-bold">
                                        {initials}
                                    </span>
                                )}
                            </Link>
                        ) : (
                            <Link to="/login" className="hover:opacity-80 transition-opacity duration-300 scale-95 ease-out p-2 rounded-full hover:bg-surface-container-low" aria-label="account_circle">
                                <span className="material-symbols-outlined font-light text-3xl" style={{ fontVariationSettings: "'wght' 300" }}>account_circle</span>
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => setMobileOpen((prev) => !prev)}
                            className="lg:hidden p-2 rounded-full hover:bg-surface-container-low transition-colors"
                            aria-label="Toggle menu"
                            aria-expanded={mobileOpen}
                        >
                            <span className="material-symbols-outlined text-3xl">{mobileOpen ? 'close' : 'menu'}</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div 
                    className={`lg:hidden fixed inset-0 z-[60] transition-all duration-500 ease-in-out ${
                        mobileOpen ? 'visible' : 'invisible'
                    }`}
                >
                    <div
                        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${
                            mobileOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                        onClick={() => setMobileOpen(false)}
                        aria-hidden="true"
                    />
                    <div 
                        className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-surface flex flex-col px-8 pt-10 pb-12 shadow-2xl transition-transform duration-500 transform ease-in-out ${
                            mobileOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-12">
                            <Link to="/" className="flex items-center gap-2">
                                <img src={logo} alt="Furnix" className="h-14 w-auto object-contain" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                                aria-label="Close menu"
                            >
                                <span className="material-symbols-outlined text-3xl">close</span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-8 font-body text-3xl font-light">
                            <Link 
                                to="/gallery" 
                                className={`transition-all duration-300 ${isActive('/gallery') ? 'text-primary pl-4 font-normal' : 'text-primary/60 hover:pl-4'}`}
                            >
                                Gallery
                            </Link>
                            <Link 
                                to="/#collection" 
                                onClick={() => setMobileOpen(false)} 
                                className={`transition-all duration-300 ${isActive('/#collection') ? 'text-primary pl-4 font-normal' : 'text-primary/60 hover:pl-4'}`}
                            >
                                Collection
                            </Link>
                            <Link 
                                to="/track-order" 
                                className={`transition-all duration-300 ${isActive('/track-order') ? 'text-primary pl-4 font-normal' : 'text-primary/60 hover:pl-4'}`}
                            >
                                Track Order
                            </Link>
                            <Link 
                                to="/contact" 
                                className={`transition-all duration-300 ${isActive('/contact') ? 'text-primary pl-4 font-normal' : 'text-primary/60 hover:pl-4'}`}
                            >
                                Contact
                            </Link>
                        </div>

                        <div className="mt-auto flex flex-col gap-4">
                            <Link
                                to="/order"
                                className={`inline-flex items-center justify-center rounded-full bg-primary px-6 py-4 text-sm font-bold uppercase tracking-widest text-on-primary shadow-xl transition-all duration-300 ${
                                    isActive('/order') ? 'ring-4 ring-primary/30 scale-105' : ''
                                }`}
                            >
                                Custom Order
                            </Link>
                            <a
                                href={user ? `https://wa.me/${whatsappNumber}` : '#'}
                                target={user ? "_blank" : undefined}
                                rel={user ? "noreferrer" : undefined}
                                onClick={handleWhatsAppClick}
                                className="inline-flex items-center justify-center rounded-full border-2 border-[#25D366] px-6 py-4 text-sm font-bold uppercase tracking-widest text-[#25D366] shadow-md"
                            >
                                WhatsApp {user ? 'Chat' : 'Login'}
                            </a>
                        </div>
                    </div>
                </div>
                <WhatsAppLoginModal 
                    isOpen={showWhatsAppModal} 
                    onClose={() => setShowWhatsAppModal(false)} 
                />
            </nav>
            {/* Spacer */}
            <div className="h-24 md:h-32" />
        </>
    );
};

export default Navbar;
