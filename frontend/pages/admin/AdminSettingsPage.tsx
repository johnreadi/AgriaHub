import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_ACTU_DATA } from '../../constants';
import type { AppearanceSettings } from '../../types';
import { useToast } from '../../components/ToastProvider';

const SETTINGS_KEY = 'agria-app-settings';
const MENU_STORAGE_KEY = 'weeklyMenu';
const ACTU_STORAGE_KEY = 'agria-actu';
const APPEARANCE_SETTINGS_KEY = 'agria-appearance-settings';
const EMAIL_SETTINGS_KEY = 'agria-email-settings';
const PAYMENT_SETTINGS_KEY = 'agria-payment-settings';
const PASSWORD_SETTINGS_KEY = 'agria-password-settings';

interface Settings {
    restaurantName: string;
    address: string;
    phone: string;
    email: string;
    openingHours: string;
}

interface EmailSettings {
    provider: 'smtp' | 'sendgrid' | 'mailgun';
    fromName: string;
    fromEmail: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpSecure: boolean;
    apiKey: string;
}

const SectionCard: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const AdminSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<Settings>({
        restaurantName: 'Agria Rouen',
        address: '2 Rue Saint-Sever, 76100 Rouen',
        phone: '02 32 18 97 80',
        email: 'secretariatagria@free.fr',
        openingHours: 'Lundi - Vendredi : 11h20 - 13h30'
    });
     const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
        logo: '',
        backgroundType: 'color',
        backgroundValue: '#f9fafb',
        header: {
            titleText: 'AGRIA ROUEN',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            titleColor: '#1f2937',
            titleFontFamily: "'Playfair Display', serif"
        },
        menu: {
            backgroundColor: '#f1f5f9', // gray-100
            textColor: '#4b5563', // gray-600
            titleColor: '#374151', // gray-700
            fontSize: '1rem',
            fontFamily: "'Montserrat', sans-serif"
        },
        footer: {
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
        }
    });
    const [emailSettings, setEmailSettings] = useState<EmailSettings>({
        provider: 'smtp',
        fromName: 'Agria Rouen',
        fromEmail: 'noreply@agria-rouen.fr',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        smtpSecure: true,
        apiKey: '',
    });
    
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [paymentSettings, setPaymentSettings] = useState({
        apiKey: 'pk_test_************************',
        secretKey: 'sk_test_***********************',
        cardReader: 'Stripe Reader M2'
    });
    const { addToast } = useToast();


    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
            const savedAppearance = localStorage.getItem(APPEARANCE_SETTINGS_KEY);
            if (savedAppearance) {
                const parsed = JSON.parse(savedAppearance);
                // Merge deeply to avoid losing new default fields if they aren't in localStorage
                setAppearanceSettings(prev => ({
                    ...prev,
                    ...parsed,
                     header: {
                        ...prev.header!,
                        ...(parsed.header || {})
                    },
                    menu: {
                        ...prev.menu!,
                        ...(parsed.menu || {})
                    },
                    footer: {
                        ...prev.footer!,
                        ...(parsed.footer || {})
                    }
                }));
            }
            const savedEmailSettings = localStorage.getItem(EMAIL_SETTINGS_KEY);
            if (savedEmailSettings) {
                setEmailSettings(JSON.parse(savedEmailSettings));
            }
            const savedPaymentSettings = localStorage.getItem(PAYMENT_SETTINGS_KEY);
            if (savedPaymentSettings) {
                setPaymentSettings(JSON.parse(savedPaymentSettings));
            }
        } catch (e) {
            console.error("Failed to load settings from localStorage", e);
        }
    }, []);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

     const handleAppearanceChange = (field: keyof AppearanceSettings, value: any) => {
        setAppearanceSettings(prev => ({...prev, [field]: value}));
    };
    
    const handleHeaderAppearanceChange = (field: keyof NonNullable<AppearanceSettings['header']>, value: string) => {
        setAppearanceSettings(prev => ({
            ...prev,
            header: {
                ...prev.header!,
                [field]: value,
            },
        }));
    };
    
    const handleMenuAppearanceChange = (field: keyof NonNullable<AppearanceSettings['menu']>, value: string) => {
        setAppearanceSettings(prev => ({
            ...prev,
            menu: {
                ...prev.menu!,
                [field]: value,
            },
        }));
    };
    
    const handleFooterAppearanceChange = (field: keyof NonNullable<AppearanceSettings['footer']>, value: string | boolean) => {
        setAppearanceSettings(prev => ({
            ...prev,
            footer: {
                ...prev.footer!,
                [field]: value,
            },
        }));
    };


    const handleEmailSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setEmailSettings(prev => ({ ...prev, [name]: checked }));
        } else {
             const val = type === 'number' ? parseInt(value, 10) : value;
             setEmailSettings(prev => ({ ...prev, [name]: val }));
        }
    };


    const handleFileChange = (field: 'logo' | 'backgroundValue' | 'footerLogo', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                addToast("L'image est trop grande (max 2 Mo).", 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                 if (field === 'backgroundValue') {
                    setAppearanceSettings(prev => ({...prev, backgroundType: 'image', backgroundValue: reader.result as string}));
                } else if (field === 'logo') {
                    handleAppearanceChange('logo', reader.result as string);
                } else if (field === 'footerLogo') {
                    handleFooterAppearanceChange('logo', reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPaymentSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        addToast('Informations générales sauvegardées !', 'success');
    };
    
    const handleSaveAppearance = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(appearanceSettings));
        addToast("Apparence sauvegardée ! Rechargez le site public pour voir les changements.", 'success');
        window.dispatchEvent(new Event('storage')); // Trigger update for components listening to storage
    };

    const handleSaveEmailSettings = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(emailSettings));
        addToast('Configuration email sauvegardée !', 'success');
    };

    const handleSendTestEmail = () => {
        if (!emailSettings.fromEmail) {
            addToast("Veuillez configurer l'email d'expédition avant de tester.", 'error');
            return;
        }
        const userEmail = prompt("Entrez votre adresse email pour recevoir un email de test :");
        if (userEmail && /^\S+@\S+\.\S+$/.test(userEmail)) {
            addToast(`(Simulation) Email de test envoyé à ${userEmail} depuis ${emailSettings.fromEmail} via ${emailSettings.provider}.`, 'info');
        } else if (userEmail) {
            addToast("Adresse email invalide.", 'error');
        }
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            addToast("Le nouveau mot de passe et sa confirmation ne correspondent pas.", 'error');
            return;
        }
        if (passwordData.new.length < 6) {
            addToast("Le nouveau mot de passe doit contenir au moins 6 caractères.", 'error');
            return;
        }
        // Save password data (in a real app, this would be hashed and sent to server)
        const passwordInfo = {
            lastChanged: new Date().toISOString(),
            hasPassword: true
        };
        localStorage.setItem(PASSWORD_SETTINGS_KEY, JSON.stringify(passwordInfo));
        setPasswordData({ current: '', new: '', confirm: '' });
        addToast('Mot de passe mis à jour avec succès !', 'success');
    };

    const handleSavePaymentKeys = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(paymentSettings));
        console.log("Saving Payment Keys:", { apiKey: paymentSettings.apiKey, secretKey: paymentSettings.secretKey });
        addToast('Clés de paiement sauvegardées avec succès !', 'success');
    };

    const handleConnectReader = () => {
        addToast(`Connexion au lecteur '${paymentSettings.cardReader}'...`, 'info');
        setTimeout(() => {
             addToast(`Lecteur '${paymentSettings.cardReader}' connecté.`, 'success');
        }, 2000);
    };

    const handleResetMenu = () => {
        if (window.confirm("Êtes-vous sûr de vouloir réinitialiser le menu ? Le menu actuel sera perdu.")) {
            localStorage.removeItem(MENU_STORAGE_KEY);
            addToast("Le menu a été réinitialisé.", 'success');
        }
    };

    const handleResetActu = () => {
        if (window.confirm("Êtes-vous sûr de vouloir réinitialiser les actualités ? Toutes les modifications seront perdues.")) {
            localStorage.setItem(ACTU_STORAGE_KEY, JSON.stringify(INITIAL_ACTU_DATA));
            addToast("Les actualités ont été réinitialisées aux valeurs par défaut.", 'success');
        }
    };
    
    const currentFooter = appearanceSettings.footer || { logo: '', backgroundColor: '', textColor: '', titleColor: '', fontFamily: '', descriptionText: '', copyrightText: '', showLinks: true, showSocial: true, showNewsletter: true };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-700 mb-6">Paramètres</h1>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <SectionCard title="Informations du Restaurant">
                        <form onSubmit={handleSaveSettings} className="space-y-4">
                            <div>
                                <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700">Nom du site</label>
                                <input type="text" name="restaurantName" id="restaurantName" value={settings.restaurantName} onChange={handleSettingsChange} className="mt-1 block w-full input-style"/>
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse</label>
                                <input type="text" name="address" id="address" value={settings.address} onChange={handleSettingsChange} className="mt-1 block w-full input-style"/>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                                <input type="tel" name="phone" id="phone" value={settings.phone} onChange={handleSettingsChange} className="mt-1 block w-full input-style"/>
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email de contact</label>
                                <input type="email" name="email" id="email" value={settings.email} onChange={handleSettingsChange} className="mt-1 block w-full input-style"/>
                            </div>
                            <div>
                                <label htmlFor="openingHours" className="block text-sm font-medium text-gray-700">Horaires d'ouverture</label>
                                <input type="text" name="openingHours" id="openingHours" value={settings.openingHours} onChange={handleSettingsChange} className="mt-1 block w-full input-style"/>
                            </div>
                            <button type="submit" className="w-full btn-primary">Sauvegarder les informations</button>
                        </form>
                    </SectionCard>
                    
                     <SectionCard title="Personnalisation de l'Apparence">
                        <form onSubmit={handleSaveAppearance} className="space-y-6">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Logo du site (en-tête)</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <div className="w-24 h-12 bg-gray-100 border rounded flex items-center justify-center p-1">
                                        {appearanceSettings.logo ? <img src={appearanceSettings.logo} alt="Aperçu du logo" className="max-h-full max-w-xs object-contain" /> : <span className="text-xs text-gray-400">Aucun</span>}
                                    </div>
                                    <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Changer le logo
                                        <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange('logo', e)} />
                                    </label>
                                </div>
                            </div>

                            {/* Background */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Arrière-plan principal</label>
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center">
                                        <input type="radio" name="backgroundType" value="color" checked={appearanceSettings.backgroundType === 'color'} onChange={() => handleAppearanceChange('backgroundType', 'color')} className="form-radio h-4 w-4 text-agria-green focus:ring-agria-green" />
                                        <span className="ml-2">Couleur</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input type="radio" name="backgroundType" value="image" checked={appearanceSettings.backgroundType === 'image'} onChange={() => handleAppearanceChange('backgroundType', 'image')} className="form-radio h-4 w-4 text-agria-green focus:ring-agria-green" />
                                        <span className="ml-2">Image</span>
                                    </label>
                                </div>
                                <div className="mt-2">
                                    {appearanceSettings.backgroundType === 'color' ? (
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={appearanceSettings.backgroundValue} onChange={(e) => handleAppearanceChange('backgroundValue', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer" />
                                            <input type="text" value={appearanceSettings.backgroundValue} onChange={(e) => handleAppearanceChange('backgroundValue', e.target.value)} className="input-style w-full" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 h-12 bg-gray-100 border rounded flex items-center justify-center overflow-hidden">
                                                {appearanceSettings.backgroundValue && appearanceSettings.backgroundValue.startsWith('data:image') ? <img src={appearanceSettings.backgroundValue} alt="Aperçu de l'arrière-plan" className="h-full w-full object-cover" /> : <span className="text-xs text-gray-400">Aucune</span>}
                                            </div>
                                            <label htmlFor="bg-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                                Changer l'image
                                                <input id="bg-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange('backgroundValue', e)} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                             <hr/>
                            <h3 className="text-md font-semibold text-gray-600 pt-2">Personnalisation de l'En-tête</h3>
                            <div>
                                <label htmlFor="headerTitleText" className="block text-sm font-medium text-gray-700">Texte du titre (si pas de logo)</label>
                                <input type="text" id="headerTitleText" value={appearanceSettings.header?.titleText || ''} onChange={(e) => handleHeaderAppearanceChange('titleText', e.target.value)} className="mt-1 block w-full input-style"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Couleur d'arrière-plan</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="color" value={appearanceSettings.header?.backgroundColor || ''} onChange={(e) => handleHeaderAppearanceChange('backgroundColor', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer"/>
                                        <input type="text" value={appearanceSettings.header?.backgroundColor || ''} onChange={(e) => handleHeaderAppearanceChange('backgroundColor', e.target.value)} className="input-style w-full"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Couleur du titre</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="color" value={appearanceSettings.header?.titleColor || ''} onChange={(e) => handleHeaderAppearanceChange('titleColor', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer"/>
                                        <input type="text" value={appearanceSettings.header?.titleColor || ''} onChange={(e) => handleHeaderAppearanceChange('titleColor', e.target.value)} className="input-style w-full"/>
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="headerFontFamily" className="block text-sm font-medium text-gray-700">Police du titre</label>
                                <select id="headerFontFamily" value={appearanceSettings.header?.titleFontFamily || ''} onChange={(e) => handleHeaderAppearanceChange('titleFontFamily', e.target.value)} className="mt-1 block w-full input-style">
                                    <option value="'Playfair Display', serif">Playfair Display (Défaut)</option>
                                    <option value="'Montserrat', sans-serif">Montserrat</option>
                                    <option value="Arial, sans-serif">Arial</option>
                                    <option value="Georgia, serif">Georgia</option>
                                    <option value="Verdana, sans-serif">Verdana</option>
                                </select>
                            </div>

                            <hr/>
                            <h3 className="text-md font-semibold text-gray-600 pt-2">Personnalisation du Menu Latéral</h3>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Couleur d'arrière-plan</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="color" value={appearanceSettings.menu?.backgroundColor || ''} onChange={(e) => handleMenuAppearanceChange('backgroundColor', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer"/>
                                    <input type="text" value={appearanceSettings.menu?.backgroundColor || ''} onChange={(e) => handleMenuAppearanceChange('backgroundColor', e.target.value)} className="input-style w-full"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Couleur du texte</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="color" value={appearanceSettings.menu?.textColor || ''} onChange={(e) => handleMenuAppearanceChange('textColor', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer"/>
                                        <input type="text" value={appearanceSettings.menu?.textColor || ''} onChange={(e) => handleMenuAppearanceChange('textColor', e.target.value)} className="input-style w-full"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Couleur du titre</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="color" value={appearanceSettings.menu?.titleColor || ''} onChange={(e) => handleMenuAppearanceChange('titleColor', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer"/>
                                        <input type="text" value={appearanceSettings.menu?.titleColor || ''} onChange={(e) => handleMenuAppearanceChange('titleColor', e.target.value)} className="input-style w-full"/>
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="menuFontSize" className="block text-sm font-medium text-gray-700">Taille de police</label>
                                <input type="text" id="menuFontSize" value={appearanceSettings.menu?.fontSize || ''} onChange={(e) => handleMenuAppearanceChange('fontSize', e.target.value)} placeholder="ex: 16px or 1rem" className="mt-1 block w-full input-style"/>
                            </div>
                             <div>
                                <label htmlFor="menuFontFamily" className="block text-sm font-medium text-gray-700">Police de caractère</label>
                                <select id="menuFontFamily" value={appearanceSettings.menu?.fontFamily || ''} onChange={(e) => handleMenuAppearanceChange('fontFamily', e.target.value)} className="mt-1 block w-full input-style">
                                    <option value="'Montserrat', sans-serif">Montserrat (Défaut)</option>
                                    <option value="'Playfair Display', serif">Playfair Display</option>
                                    <option value="Arial, sans-serif">Arial</option>
                                    <option value="Georgia, serif">Georgia</option>
                                    <option value="Verdana, sans-serif">Verdana</option>
                                </select>
                            </div>
                            
                            <hr/>
                            <h3 className="text-md font-semibold text-gray-600 pt-2">Personnalisation du Pied de Page</h3>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Logo du pied de page</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <div className="w-24 h-12 bg-gray-100 border rounded flex items-center justify-center p-1">
                                        {currentFooter.logo ? <img src={currentFooter.logo} alt="Aperçu du logo" className="max-h-full max-w-xs object-contain" /> : <span className="text-xs text-gray-400">Aucun</span>}
                                    </div>
                                    <label htmlFor="footer-logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        Changer
                                        <input id="footer-logo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange('footerLogo', e)} />
                                    </label>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Couleur d'arrière-plan</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="color" value={currentFooter.backgroundColor} onChange={(e) => handleFooterAppearanceChange('backgroundColor', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer"/>
                                    <input type="text" value={currentFooter.backgroundColor} onChange={(e) => handleFooterAppearanceChange('backgroundColor', e.target.value)} className="input-style w-full"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Couleur du texte</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="color" value={currentFooter.textColor} onChange={(e) => handleFooterAppearanceChange('textColor', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer"/>
                                        <input type="text" value={currentFooter.textColor} onChange={(e) => handleFooterAppearanceChange('textColor', e.target.value)} className="input-style w-full"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Couleur des titres</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="color" value={currentFooter.titleColor} onChange={(e) => handleFooterAppearanceChange('titleColor', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer"/>
                                        <input type="text" value={currentFooter.titleColor} onChange={(e) => handleFooterAppearanceChange('titleColor', e.target.value)} className="input-style w-full"/>
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Police de caractère</label>
                                <select value={currentFooter.fontFamily} onChange={(e) => handleFooterAppearanceChange('fontFamily', e.target.value)} className="mt-1 block w-full input-style">
                                    <option value="'Montserrat', sans-serif">Montserrat (Défaut)</option>
                                    <option value="'Playfair Display', serif">Playfair Display</option>
                                    <option value="Arial, sans-serif">Arial</option>
                                    <option value="Georgia, serif">Georgia</option>
                                    <option value="Verdana, sans-serif">Verdana</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Texte de description</label>
                                <input type="text" value={currentFooter.descriptionText} onChange={(e) => handleFooterAppearanceChange('descriptionText', e.target.value)} className="mt-1 block w-full input-style"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Texte de copyright</label>
                                <input type="text" value={currentFooter.copyrightText} onChange={(e) => handleFooterAppearanceChange('copyrightText', e.target.value)} className="mt-1 block w-full input-style"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Composants à afficher</label>
                                <div className="space-y-2">
                                    <label className="flex items-center"><input type="checkbox" checked={currentFooter.showLinks} onChange={(e) => handleFooterAppearanceChange('showLinks', e.target.checked)} className="form-checkbox"/> <span className="ml-2">Liens rapides</span></label>
                                    <label className="flex items-center"><input type="checkbox" checked={currentFooter.showSocial} onChange={(e) => handleFooterAppearanceChange('showSocial', e.target.checked)} className="form-checkbox"/> <span className="ml-2">Suivez-nous</span></label>
                                    <label className="flex items-center"><input type="checkbox" checked={currentFooter.showNewsletter} onChange={(e) => handleFooterAppearanceChange('showNewsletter', e.target.checked)} className="form-checkbox"/> <span className="ml-2">Newsletter</span></label>
                                </div>
                            </div>


                            <button type="submit" className="w-full btn-primary mt-4">Sauvegarder l'apparence</button>
                        </form>
                    </SectionCard>

                     <SectionCard title="Gestion des données">
                         <div className="flex flex-col sm:flex-row gap-4">
                             <button type="button" onClick={handleResetMenu} className="w-full btn-danger">Réinitialiser le menu</button>
                             <button type="button" onClick={handleResetActu} className="w-full btn-danger">Réinitialiser les actus</button>
                         </div>
                         <p className="text-xs text-gray-500 text-center">Attention, ces actions sont irréversibles.</p>
                    </SectionCard>
                </div>
                
                <div className="space-y-8">
                    <SectionCard title="Sécurité">
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label htmlFor="current" className="block text-sm font-medium text-gray-700">Mot de passe actuel</label>
                                <input type="password" name="current" id="current" value={passwordData.current} onChange={handlePasswordChange} className="mt-1 block w-full input-style"/>
                            </div>
                            <div>
                                <label htmlFor="new" className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                                <input type="password" name="new" id="new" value={passwordData.new} onChange={handlePasswordChange} className="mt-1 block w-full input-style"/>
                            </div>
                            <div>
                                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label>
                                <input type="password" name="confirm" id="confirm" value={passwordData.confirm} onChange={handlePasswordChange} className="mt-1 block w-full input-style"/>
                            </div>
                            <button type="submit" className="w-full btn-primary">Changer le mot de passe</button>
                        </form>
                    </SectionCard>

                    <SectionCard title="Configuration de Paiement">
                        <form onSubmit={handleSavePaymentKeys} className="space-y-4">
                             <h3 className="text-md font-semibold text-gray-600">Passerelle de Paiement (API)</h3>
                             <div>
                                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">Clé API Publique</label>
                                <input type="password" name="apiKey" id="apiKey" value={paymentSettings.apiKey} onChange={handlePaymentSettingsChange} className="mt-1 block w-full input-style" placeholder="pk_test_..."/>
                            </div>
                            <div>
                                <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">Clé API Secrète</label>
                                <input type="password" name="secretKey" id="secretKey" value={paymentSettings.secretKey} onChange={handlePaymentSettingsChange} className="mt-1 block w-full input-style" placeholder="sk_test_..."/>
                            </div>
                            <button type="submit" className="w-full btn-secondary">Sauvegarder les clés</button>
                        </form>

                        <hr className="my-4" />
                        
                        <div className="space-y-4">
                            <h3 className="text-md font-semibold text-gray-600">Lecteur de carte de crédit</h3>
                             <div>
                                <label htmlFor="cardReader" className="block text-sm font-medium text-gray-700">Modèle de lecteur</label>
                                <select name="cardReader" id="cardReader" value={paymentSettings.cardReader} onChange={handlePaymentSettingsChange} className="mt-1 block w-full input-style">
                                    <option>Stripe Reader M2</option>
                                    <option>Square Terminal</option>
                                    <option>Verifone P400</option>
                                    <option>Ingenico Move/5000</option>
                                </select>
                            </div>
                            <button type="button" onClick={handleConnectReader} className="w-full btn-primary">Connecter un lecteur</button>
                        </div>
                    </SectionCard>

                    <SectionCard title="Configuration Email">
                        <p className="text-xs text-gray-500 -mt-2 mb-2">
                            Configurez comment le système envoie des emails pour la messagerie et les newsletters.
                        </p>
                        <form onSubmit={handleSaveEmailSettings} className="space-y-4">
                            <div>
                                <label htmlFor="provider" className="block text-sm font-medium text-gray-700">Fournisseur de messagerie</label>
                                <select name="provider" id="provider" value={emailSettings.provider} onChange={handleEmailSettingsChange} className="mt-1 block w-full input-style">
                                    <option value="smtp">SMTP</option>
                                    <option value="sendgrid">SendGrid</option>
                                    <option value="mailgun">Mailgun</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fromName" className="block text-sm font-medium text-gray-700">Nom de l'expéditeur</label>
                                    <input type="text" name="fromName" id="fromName" value={emailSettings.fromName} onChange={handleEmailSettingsChange} className="mt-1 block w-full input-style"/>
                                </div>
                                <div>
                                    <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700">Email de l'expéditeur</label>
                                    <input type="email" name="fromEmail" id="fromEmail" value={emailSettings.fromEmail} onChange={handleEmailSettingsChange} className="mt-1 block w-full input-style"/>
                                </div>
                            </div>
                            
                            {emailSettings.provider === 'smtp' && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-md border">
                                    <h4 className="font-semibold text-gray-600">Paramètres SMTP</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700">Hôte SMTP</label>
                                            <input type="text" name="smtpHost" id="smtpHost" value={emailSettings.smtpHost} onChange={handleEmailSettingsChange} className="mt-1 block w-full input-style"/>
                                        </div>
                                        <div>
                                            <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700">Port</label>
                                            <input type="number" name="smtpPort" id="smtpPort" value={emailSettings.smtpPort} onChange={handleEmailSettingsChange} className="mt-1 block w-full input-style"/>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700">Utilisateur</label>
                                            <input type="text" name="smtpUser" id="smtpUser" value={emailSettings.smtpUser} onChange={handleEmailSettingsChange} className="mt-1 block w-full input-style"/>
                                        </div>
                                        <div>
                                            <label htmlFor="smtpPass" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                            <input type="password" name="smtpPass" id="smtpPass" value={emailSettings.smtpPass} onChange={handleEmailSettingsChange} className="mt-1 block w-full input-style"/>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <input type="checkbox" name="smtpSecure" id="smtpSecure" checked={emailSettings.smtpSecure} onChange={handleEmailSettingsChange} className="h-4 w-4 text-agria-green focus:ring-agria-green border-gray-300 rounded"/>
                                        <label htmlFor="smtpSecure" className="ml-2 block text-sm text-gray-900">Utiliser une connexion sécurisée (TLS/SSL)</label>
                                    </div>
                                </div>
                            )}

                            {(emailSettings.provider === 'sendgrid' || emailSettings.provider === 'mailgun') && (
                                 <div className="space-y-4 p-4 bg-gray-50 rounded-md border">
                                    <h4 className="font-semibold text-gray-600">Paramètres API</h4>
                                    <div>
                                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">Clé API</label>
                                        <input type="password" name="apiKey" id="apiKey" value={emailSettings.apiKey} onChange={handleEmailSettingsChange} className="mt-1 block w-full input-style"/>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex gap-4">
                                <button type="submit" className="w-full btn-primary">Sauvegarder</button>
                                <button type="button" onClick={handleSendTestEmail} className="w-full btn-secondary">Envoyer un test</button>
                            </div>
                        </form>
                    </SectionCard>
                </div>
            </div>
             <style>{`
                .input-style {
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #D1D5DB;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                }
                .input-style:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    border-color: #009A58;
                    box-shadow: 0 0 0 2px #009A58;
                }
                .btn-primary {
                    padding: 0.5rem 1rem;
                    background-color: #009A58;
                    color: white;
                    font-weight: bold;
                    border-radius: 0.375rem;
                    transition: background-color 0.2s;
                }
                .btn-primary:hover {
                    background-color: #007a4a;
                }
                .btn-secondary {
                    padding: 0.5rem 1rem;
                    background-color: #F3F4F6;
                    color: #1F2937;
                    font-weight: bold;
                    border-radius: 0.375rem;
                    border: 1px solid #D1D5DB;
                    transition: background-color 0.2s;
                }
                .btn-secondary:hover {
                    background-color: #E5E7EB;
                }
                .btn-danger {
                    padding: 0.5rem 1rem;
                    background-color: #EF4444;
                    color: white;
                    font-weight: bold;
                    border-radius: 0.375rem;
                    transition: background-color 0.2s;
                }
                .btn-danger:hover {
                    background-color: #DC2626;
                }
                .form-checkbox {
                    color: #009A58;
                    border-radius: 0.25rem;
                }
                .form-checkbox:focus {
                    ring: #009A58;
                }
            `}</style>
        </div>
    );
};

export default AdminSettingsPage;