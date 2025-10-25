import React, { useState, useEffect } from 'react';
import { NAV_LINKS } from '../constants';
import { FacebookIcon, SendIcon } from './icons/Icons';
import type { AppearanceSettings } from '../types';
import { useToast } from './ToastProvider';
import { SpinnerIcon } from './icons/Icons';
import apiService from '../src/services/api.js';

const APPEARANCE_SETTINGS_KEY = 'agria-appearance-settings';

const defaultFooterSettings = {
    logo: '',
    backgroundColor: '#111827', // gray-900
    textColor: '#D1D5DB', // gray-300
    titleColor: '#FFFFFF', // white
    fontFamily: "'Montserrat', sans-serif",
    descriptionText: "Votre pause déjeuner gourmande et équilibrée au coeur de Rouen.",
    copyrightText: "Agria Rouen. Tous droits réservés.",
    showLinks: true,
    showSocial: true,
    showNewsletter: true,
};

const Footer: React.FC = () => {
    const [footerSettings, setFooterSettings] = useState(defaultFooterSettings);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadSettings = () => {
            try {
                const savedAppearance = localStorage.getItem(APPEARANCE_SETTINGS_KEY);
                if (savedAppearance) {
                    const settings: Partial<AppearanceSettings> = JSON.parse(savedAppearance);
                    if (settings.footer) {
                        setFooterSettings(prev => ({ ...prev, ...settings.footer }));
                    }
                }
            } catch (e) {
                console.error("Failed to load footer settings", e);
            }
        };

        loadSettings();
        // Listen for changes from admin panel
        window.addEventListener('storage', loadSettings);
        return () => window.removeEventListener('storage', loadSettings);
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith('#')) {
            e.preventDefault();
            window.location.hash = href;
        }
    };
    
    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsletterEmail || !/^\S+@\S+\.\S+$/.test(newsletterEmail)) {
            addToast('Veuillez entrer une adresse email valide.', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            // Appel API public pour souscrire
            await apiService.addSubscriber({ email: newsletterEmail });
            addToast('Merci pour votre inscription !', 'success');
            setNewsletterEmail('');
        } catch (error: any) {
            console.error(error);
            const msg = (error?.message || '').toLowerCase();
            if (msg.includes('abonné') || msg.includes('409') || msg.includes('400')) {
                addToast("Vous êtes déjà inscrit à notre newsletter !", 'info');
            } else {
                addToast("Une erreur est survenue lors de l'inscription.", 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <footer className="custom-footer">
            <div className="container mx-auto px-6 py-12">
                
                {/* New Centered Newsletter Section */}
                {footerSettings.showNewsletter && (
                    <div className="mb-12 pb-10 border-b border-gray-700/50 text-center">
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-y-4 gap-x-8">
                            <div className="lg:text-left">
                                <h4 className="font-bold uppercase tracking-wider mb-2 custom-footer-title">Newsletter</h4>
                                <p className="text-sm opacity-75 custom-footer-text">
                                    Recevez les menus et actualités en avant-première.
                                </p>
                            </div>
                            <form onSubmit={handleNewsletterSubmit} className="w-full max-w-md">
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        required
                                        placeholder="Votre adresse email"
                                        aria-label="Adresse email pour la newsletter"
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-agria-green text-white text-sm"
                                        disabled={isSubmitting}
                                    />
                                    <button type="submit" aria-label="S'inscrire à la newsletter" className="bg-agria-green hover:bg-agria-green-dark text-white font-semibold px-4 py-2 rounded-md transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isSubmitting ? <SpinnerIcon /> : <SendIcon className="h-5 w-5"/>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Column 1: Logo & About */}
                    <div className="w-full md:w-1/2 text-center md:text-left">
                        <a href="#" onClick={(e) => handleNavClick(e, '#')} className="inline-block mb-4">
                             {footerSettings.logo ? (
                                <img src={footerSettings.logo} alt="Logo" className="max-h-16 mx-auto md:mx-0" />
                            ) : (
                                <>
                                    <div className="font-bold text-2xl font-serif tracking-wider custom-footer-title">agria</div>
                                    <div className="text-xs tracking-[0.2em] -mt-1 opacity-75 custom-footer-text">ROUEN</div>
                                </>
                            )}
                        </a>
                        <p className="text-sm opacity-75 max-w-xs mx-auto md:mx-0 custom-footer-text">
                            {footerSettings.descriptionText}
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    {footerSettings.showLinks && (
                        <div className="w-full md:w-1/4 text-center md:text-left">
                            <h4 className="font-bold uppercase tracking-wider mb-4 custom-footer-title">Liens rapides</h4>
                            <ul className="space-y-2">
                                {NAV_LINKS.map(link => (
                                    <li key={`footer-${link.name}`}>
                                        <a href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="custom-footer-text hover:text-agria-green transition-colors duration-300 text-sm">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                                <li>
                                    <a href="#admin" onClick={(e) => handleNavClick(e, '#admin')} className="custom-footer-text hover:text-agria-green transition-colors duration-300 text-sm">
                                        Administration
                                    </a>
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Column 3: Social Media */}
                    {footerSettings.showSocial && (
                        <div className="w-full md:w-1/4 text-center md:text-left">
                            <h4 className="font-bold uppercase tracking-wider mb-4 custom-footer-title">Suivez-nous</h4>
                            <div className="flex justify-center md:justify-start space-x-4">
                                <a href="https://www.facebook.com/agriarouen/" target="_blank" rel="noopener noreferrer" className="custom-footer-text opacity-75 hover:opacity-100 hover:text-white transition-all duration-300"><FacebookIcon /></a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="custom-footer-bottom py-4">
                <div className="w-full px-6 text-center opacity-50 text-sm custom-footer-text">
                    &copy; {new Date().getFullYear()} {footerSettings.copyrightText}
                </div>
            </div>
        </footer>
    );
};

export default Footer;