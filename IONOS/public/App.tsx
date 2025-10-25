import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import { ChatBubbleIcon, DownloadIcon, CloseIcon, ArrowUpIcon } from './components/icons/Icons';
import { LoadingOverlay, Spinner, PageTransition, ScrollReveal, AnimatedButton } from './components/animations';
import AnimationMonitor, { AnimationDebugger } from './components/animations/AnimationMonitor';
import type { AppearanceSettings } from './types';

// Lazy loading des pages pour améliorer les performances
const HomePage = lazy(() => import('./pages/HomePage'));
const Menu = lazy(() => import('./components/Menu'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'));
const RechargePage = lazy(() => import('./pages/RechargePage'));
const MangerPage = lazy(() => import('./pages/MangerPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const TraiteurPage = lazy(() => import('./pages/TraiteurPage'));
const TakeawayPage = lazy(() => import('./pages/TakeawayPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const Chatbot = lazy(() => import('./components/Chatbot'));
const LoginPage = lazy(() => import('./components/Login'));

const APPEARANCE_SETTINGS_KEY = 'agria-appearance-settings';

// Composant de chargement optimisé avec animations
const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Spinner size="xl" color="primary" />
  </div>
));

const FloatingActionButtons = React.memo<{
  isChatOpen: boolean;
  onChatOpen: () => void;
  onChatClose: () => void;
  installPromptEvent: any;
  onInstall: () => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
}>(({ isChatOpen, onChatOpen, onChatClose, installPromptEvent, onInstall, showBackToTop, onBackToTop }) => (
  <>
    <div className="fixed bottom-24 md:bottom-6 right-6 z-30 flex flex-col items-center gap-4">
       {showBackToTop && (
         <ScrollReveal direction="up" delay={0.1}>
           <AnimatedButton
              onClick={onBackToTop}
              variant="secondary"
              size="sm"
              aria-label="Retour en haut"
              title="Retour en haut"
              className="bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-black"
            >
              <ArrowUpIcon className="h-6 w-6" />
            </AnimatedButton>
         </ScrollReveal>
      )}
      {installPromptEvent && (
         <ScrollReveal direction="up" delay={0.2}>
           <AnimatedButton
              onClick={onInstall}
              variant="primary"
              size="lg"
              aria-label="Installer l'application"
              title="Installer l'application"
              className="bg-agria-green text-white p-4 rounded-full shadow-lg hover:bg-agria-green-dark"
            >
              <DownloadIcon className="h-8 w-8" />
            </AnimatedButton>
         </ScrollReveal>
      )}
      {/* Chatbot button without ScrollReveal to ensure visibility on desktop */}
      <AnimatedButton
        onClick={onChatOpen}
        variant="primary"
        size="lg"
        aria-label="Ouvrir le chat IA"
        title="Ouvrir le chat IA"
        className="bg-agria-green text-white p-4 rounded-full shadow-lg hover:bg-agria-green-dark"
      >
        <ChatBubbleIcon className="h-8 w-8" />
      </AnimatedButton>
    </div>
    <Suspense fallback={null}>
      <Chatbot isOpen={isChatOpen} onClose={onChatClose} />
    </Suspense>
  </>
));

// --- Modal Component Logic ---
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 sm:p-8 relative">
                    <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100" aria-label="Fermer">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                    {children}
                </div>
            </div>
            <style>{`
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
                .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};


function App() {
  const [route, setRoute] = useState(window.location.hash || '#');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const isAuthenticated = useCallback(() => {
    try {
      const userData = localStorage.getItem('user_data');
      return !!(userData && userData !== '{}' && userData !== 'null');
    } catch {
      return false;
    }
  }, []);

  // Open sidebar by default on initial load for Home route (desktop & mobile)
  useEffect(() => {
    const initialRoute = window.location.hash || '#';
    if (initialRoute === '#' || initialRoute === '') {
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
        setShowBackToTop(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
  };

  const handleInstallClick = () => {
    if (!installPromptEvent) {
      return;
    }
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPromptEvent(null);
    });
  };

  // --- Route handling ---
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#');
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  // Assure que la sidebar reste ouverte sur les grands écrans après chaque changement de route
  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    if (isDesktop) {
      setIsSidebarOpen(true);
    }
  }, [route]);
    
  // --- Appearance handling ---
  useEffect(() => {
    const styleId = 'agria-custom-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    // Helper to apply default appearance if API not available
    const applyDefaultAppearance = () => {
        if (route.startsWith('#admin')) {
            styleElement.innerHTML = `body { background-color: #f3f4f6 !important; background-image: none !important; }`;
            return;
        }
        styleElement.innerHTML = `body { background-color: #f9fafb !important; background-image: none !important; }`;
    };

    // Build and apply CSS rules based on settings from API
    const applyAppearanceFromSettings = (settings: Partial<AppearanceSettings> = {}) => {
        let cssRules = '';

        // Body background
        if (settings.backgroundType === 'image' && settings.backgroundValue) {
            cssRules += `body { background-image: url(${settings.backgroundValue}) !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important; }`;
            // Le contenu doit être transparent pour laisser apparaître l'image de fond
            cssRules += `.page-content, main .bg-white { background-color: transparent !important; }`;
        } else {
            cssRules += `body { background-color: ${settings.backgroundValue || '#f9fafb'} !important; background-image: none !important; }`;
            // Forcer la couleur sur le conteneur principal (override de bg-white)
            cssRules += `.page-content, main .bg-white { background-color: ${settings.backgroundValue || '#f9fafb'} !important; }`;
        }

        // Header Customization
        if (settings.header) {
            const { backgroundColor, titleColor, titleFontFamily } = settings.header;
            cssRules += `
                .custom-header {
                    background-color: ${backgroundColor || '#ffffff'} !important;
                }
                .custom-header-title-text {
                    color: ${titleColor || '#1f2937'} !important;
                    font-family: ${titleFontFamily || "'Playfair Display', serif"} !important;
                }
            `;
        }

        // Sidebar/Menu Customization
        if (settings.menu) {
            const { backgroundColor, textColor, titleColor, fontSize, fontFamily } = settings.menu;
            cssRules += `
                .custom-sidebar {
                    background-color: ${backgroundColor || '#f1f5f9'} !important;
                    font-family: ${fontFamily || "'Montserrat', sans-serif"} !important;
                }
                .custom-sidebar nav a span {
                    font-size: ${fontSize || '1rem'} !important;
                }
                .custom-sidebar-link:not(.active-link) span, .custom-sidebar-link:not(.active-link) svg {
                    color: ${textColor || '#4b5563'} !important;
                }
                 .custom-sidebar-title {
                    color: ${titleColor || '#374151'} !important;
                }
            `;
        }

        // Footer Customization
        if (settings.footer) {
            const { backgroundColor, textColor, titleColor, fontFamily } = settings.footer;
            cssRules += `
                .custom-footer {
                    background-color: ${backgroundColor || '#111827'} !important;
                    font-family: ${fontFamily || "'Montserrat', sans-serif"} !important;
                }
                .custom-footer-text, .custom-footer-text p, .custom-footer-text a {
                    color: ${textColor || '#D1D5DB'} !important;
                }
                .custom-footer-title {
                    color: ${titleColor || '#FFFFFF'} !important;
                }
                .custom-footer a.custom-footer-text:hover {
                    color: #009A58 !important; /* Keep a consistent hover color */
                }
                .custom-footer-bottom {
                    background-color: ${backgroundColor ? 
                        `color-mix(in srgb, ${backgroundColor} 85%, black)` : 
                        '#030712' /* gray-950 */
                    } !important;
                }
            `;
        }

        styleElement.innerHTML = cssRules;
    };

    // Normaliser la réponse API (snake_case) vers le format attendu par le Front-end
    const normalizeAppearance = (payload: any): Partial<AppearanceSettings> => {
        try {
            const raw = (payload && (payload.data ?? payload.appearance ?? payload)) || {};
            return {
                logo: raw.logo ?? null,
                backgroundType: raw.background_type ?? raw.backgroundType ?? 'color',
                backgroundValue: raw.background_value ?? raw.backgroundValue ?? '#f9fafb',
                header: {
                    backgroundColor: raw.header_background_color ?? raw.header?.background_color,
                    titleColor: raw.header_title_color ?? raw.header?.title_color,
                    titleFontFamily: raw.header_title_font_family ?? raw.header?.title_font_family,
                    titleText: raw.header_title_text ?? raw.header?.title_text,
                },
                menu: {
                    backgroundColor: raw.menu_background_color ?? raw.menu?.background_color,
                    textColor: raw.menu_text_color ?? raw.menu?.text_color,
                    titleColor: raw.menu_title_color ?? raw.menu?.title_color,
                    fontSize: raw.menu_font_size ?? raw.menu?.font_size,
                    fontFamily: raw.menu_font_family ?? raw.menu?.font_family,
                },
                footer: {
                    backgroundColor: raw.footer_background_color ?? raw.footer?.background_color,
                    textColor: raw.footer_text_color ?? raw.footer?.text_color,
                    titleColor: raw.footer_title_color ?? raw.footer?.title_color,
                    fontFamily: raw.footer_font_family ?? raw.footer?.font_family,
                },
            };
        } catch {
            return {};
        }
    };

    const fetchAppearance = async () => {
        try {
            if (route.startsWith('#admin')) {
                styleElement.innerHTML = `body { background-color: #f3f4f6 !important; background-image: none !important; }`;
                return;
            }
            // Désactiver le cache navigateur/proxy pour garantir l’actualisation des préférences
            const res = await fetch('/api/settings.php?type=appearance', { cache: 'no-store' });
            if (!res.ok) {
                applyDefaultAppearance();
                return;
            }
            const payload = await res.json();
            const settings = normalizeAppearance(payload);
            applyAppearanceFromSettings(settings);
        } catch (e) {
            console.error('Failed to load appearance settings from API', e);
            applyDefaultAppearance();
        }
    };

    fetchAppearance();
}, [route]);



  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const renderContent = () => {
    const getPageContent = () => {
      switch (route) {
        case '#':
        case '':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <HomePage onRechargeClick={() => setIsRechargeModalOpen(true)} />
            </Suspense>
          );
        case '#menu':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <Menu />
            </Suspense>
          );
        case '#restaurant':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <RestaurantPage />
            </Suspense>
          );
        case '#manger':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <MangerPage />
            </Suspense>
          );
        case '#info':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <InfoPage />
            </Suspense>
          );
        case '#traiteur':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <TraiteurPage />
            </Suspense>
          );
        case '#contact':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <ContactPage />
            </Suspense>
          );
        case '#takeaway':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <TakeawayPage />
            </Suspense>
          );
        default:
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <HomePage onRechargeClick={() => setIsRechargeModalOpen(true)} />
            </Suspense>
          );
      }
    };

    return (
      <PageTransition key={route} type="fade">
        {getPageContent()}
      </PageTransition>
    );
  };
  
  // Standalone Admin Page protégée avec route #admin/login
  if (route.startsWith('#admin')) {
    const userData = localStorage.getItem('user_data');
    const authenticated = !!(userData && userData !== '{}' && userData !== 'null');

    if (!authenticated && !route.startsWith('#admin/login')) {
      window.location.hash = '#admin/login';
    }

    if (route.startsWith('#admin/login') || !authenticated) {
      return (
        <PageTransition type="fade">
          <Suspense fallback={<LoadingSpinner />}>
            <LoginPage onLoginSuccess={() => { window.location.hash = '#admin'; }} />
          </Suspense>
        </PageTransition>
      );
    }

    return (
      <PageTransition type="slide" direction="right">
        <Suspense fallback={<LoadingSpinner />}>
          <AdminPage />
        </Suspense>
      </PageTransition>
    );
  }

  // Standalone Signup Page
  if (route.startsWith('#signup') || route.startsWith('#request-access')) {
    return (
      <PageTransition type="slide" direction="left">
        <Suspense fallback={<LoadingSpinner />}>
          <SignupPage />
        </Suspense>
      </PageTransition>
    );
  }
  
  // Dashboard Layout
  return (
    <AnimationDebugger>
      <div className="flex min-h-screen bg-transparent">
        <AnimationMonitor 
          enabled={process.env.NODE_ENV === 'development'} 
          onPerformanceIssue={(metrics) => {
            console.warn('Animation performance issue detected:', metrics);
          }}
        />
        
        <Sidebar activeRoute={route} isOpen={isSidebarOpen} onClose={handleSidebarClose} onRechargeClick={() => setIsRechargeModalOpen(true)} />
        
         {/* Mobile Sidebar Overlay avec animation */}
        {isSidebarOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleSidebarClose}
                className="fixed inset-0 bg-black bg-opacity-30 z-10 md:hidden"
             />
        )}

        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
          <Header onMenuToggle={() => setIsSidebarOpen(prev => !prev)} />
          <main className="flex-1 w-full pb-20 md:pb-0">
              <ScrollReveal direction="up" className="page-content bg-white p-4 sm:p-6 md:p-10 w-full relative z-0">
                   {renderContent()}
              </ScrollReveal>
          </main>
          <Footer />
        </div>
        
        <MobileBottomNav activeRoute={route} />
        
        <FloatingActionButtons 
          isChatOpen={isChatOpen}
          onChatOpen={() => setIsChatOpen(true)}
          onChatClose={() => setIsChatOpen(false)}
          installPromptEvent={installPromptEvent}
          onInstall={handleInstallClick}
          showBackToTop={showBackToTop}
          onBackToTop={scrollToTop}
        />

        <Modal isOpen={isRechargeModalOpen} onClose={() => setIsRechargeModalOpen(false)}>
           <Suspense fallback={<LoadingSpinner />}>
             <RechargePage />
           </Suspense>
         </Modal>
      </div>
    </AnimationDebugger>
  );
}

export default App;