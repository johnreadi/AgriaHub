import React, { useState } from 'react';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, SpinnerIcon, LockIcon, UserIcon } from './icons/Icons';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Authentification via nouvel endpoint simplifié
            const response = await fetch('/api/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Stocker les informations utiles pour la session
                localStorage.setItem('user_data', JSON.stringify(data.user || {}));
                onLoginSuccess();
            } else {
                setError(data.error || 'Identifiants invalides');
            }
        } catch (error) {
            setError('Erreur de connexion. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith('#')) {
            e.preventDefault();
            window.location.hash = href;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Logo et titre */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-agria-green rounded-full flex items-center justify-center mb-4">
                        <LockIcon className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Espace Administration
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Connectez-vous pour gérer votre compte
                    </p>
                </div>

                {/* Formulaire de connexion */}
                <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-sm text-center">{error}</p>
                        </div>
                    )}
                    
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Champ nom d'utilisateur */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Email ou Nom
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-agria-green focus:border-agria-green sm:text-sm"
                                    placeholder="Entrez votre email ou votre nom"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Champ mot de passe */}
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
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-agria-green focus:border-agria-green sm:text-sm"
                                    placeholder="Mot de passe (minimum 1 caractère)"
                                    disabled={isLoading}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOffIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bouton de connexion */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-agria-green hover:bg-agria-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-agria-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Connexion en cours...
                                    </div>
                                ) : (
                                    <>
                                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                            <LockIcon className="h-5 w-5 text-agria-green-light group-hover:text-agria-green-light" />
                                        </span>
                                        Se connecter
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Lien de retour */}
                    <div className="mt-6 text-center">
                        <a 
                            href="#" 
                            onClick={(e) => handleNavClick(e, '#')} 
                            className="text-sm text-agria-green hover:text-agria-green-dark transition-colors duration-200"
                        >
                            ← Retour au site principal
                        </a>
                    </div>
                </div>

                {/* Informations de sécurité */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        Connexion sécurisée • Données protégées
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;