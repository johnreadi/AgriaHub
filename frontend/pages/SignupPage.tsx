import React, { useState } from 'react';
import apiService from '../src/services/api';
import { useToast } from '../components/ToastProvider';
import { LockIcon, UserIcon } from '../components/icons/Icons';

const SignupPage: React.FC = () => {
    const { addToast } = useToast();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith('#')) {
            e.preventDefault();
            window.location.hash = href;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validation minimale côté client
        if (!email || !password || !firstName || !lastName || !phone) {
            setError('Veuillez remplir tous les champs requis.');
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                phone,
            };

            const response = await apiService.register(payload);

            if (response && (response.success || response.user || response.message)) {
                addToast('Inscription réussie. Connexion en cours...', 'success');
                // Tentative de connexion automatique après inscription
                try {
                    const loginResp = await apiService.login(email, password);
                    const accessToken = loginResp?.token || loginResp?.access_token;
                    if (accessToken || apiService.isAuthenticated()) {
                        if (loginResp && loginResp.user) {
                            localStorage.setItem('user_data', JSON.stringify(loginResp.user));
                        }
                        window.location.hash = '#admin';
                        return;
                    }
                } catch (err) {
                    // Ignore et redirige vers la page de connexion
                }
                addToast("Veuillez vous connecter pour continuer.", 'info');
                window.location.hash = '#admin/login';
            } else {
                setError(response?.error || "Erreur lors de l'inscription.");
                addToast(response?.error || "Erreur lors de l'inscription.", 'error');
            }
        } catch (err: any) {
            const message = err?.message || "Une erreur est survenue. Veuillez réessayer.";
            setError(message);
            addToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                {/* Logo et titre */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-agria-green rounded-full flex items-center justify-center mb-4">
                        <LockIcon className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Créer un compte
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Remplissez le formulaire pour vous inscrire
                    </p>
                </div>

                {/* Formulaire d'inscription */}
                <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-sm text-center">{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Prénom et Nom */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Prénom
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-agria-green focus:border-agria-green sm:text-sm"
                                        placeholder="Votre prénom"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-agria-green focus:border-agria-green sm:text-sm"
                                        placeholder="Votre nom"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-agria-green focus:border-agria-green sm:text-sm"
                                    placeholder="exemple@domaine.com"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Téléphone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Téléphone
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="block w-full pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-agria-green focus:border-agria-green sm:text-sm"
                                placeholder="06 12 34 56 78"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-agria-green focus:border-agria-green sm:text-sm"
                                    placeholder="Choisissez un mot de passe"
                                    disabled={isLoading}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {/* icône d’œil réutilisable non nécessaire ici */}
                                        {showPassword ? (
                                            <span className="text-xs">Masquer</span>
                                        ) : (
                                            <span className="text-xs">Afficher</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bouton d'inscription */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-agria-green hover:bg-agria-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-agria-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Inscription en cours...
                                    </div>
                                ) : (
                                    <>
                                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                            <LockIcon className="h-5 w-5 text-agria-green-light group-hover:text-agria-green-light" />
                                        </span>
                                        Créer mon compte
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Liens supplémentaires */}
                    <div className="mt-6 text-center space-y-2">
                        <a 
                            href="#admin/login" 
                            onClick={(e) => handleNavClick(e, '#admin/login')} 
                            className="text-sm text-agria-green hover:text-agria-green-dark transition-colors duration-200"
                        >
                            Déjà un compte ? Se connecter
                        </a>
                        <div>
                            <a 
                                href="#" 
                                onClick={(e) => handleNavClick(e, '#')} 
                                className="text-sm text-agria-green hover:text-agria-green-dark transition-colors duration-200"
                            >
                                ← Retour au site principal
                            </a>
                        </div>
                    </div>
                </div>

                {/* Informations de sécurité */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        Inscription sécurisée • Données protégées par chiffrement côté serveur
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;