import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../../components/ToastProvider';

interface LoginFormProps {
    onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
    const [nom, setNom] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nom || !password) {
            addToast('Veuillez remplir tous les champs', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const success = await login(nom, password);
            if (success) {
                addToast('Connexion réussie', 'success');
                onSuccess?.();
            } else {
                addToast('Nom ou mot de passe incorrect', 'error');
            }
        } catch (error) {
            addToast('Erreur lors de la connexion', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow p-8">
                    <div className="text-center">
                        <h2 className="mt-0 text-3xl font-extrabold text-gray-900">Espace Administration</h2>
                        <p className="mt-2 text-sm text-gray-600">Connectez-vous pour gérer le site</p>
                    </div>
                    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                            <input
                                id="nom"
                                name="nom"
                                type="text"
                                autoComplete="username"
                                required
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder=""
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder=""
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Connexion en cours...
                                    </div>
                                ) : (
                                    'Connexion'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={() => { window.location.hash = '#'; }}
                        className="text-sm text-green-600 hover:text-green-700"
                    >
                        Retour au site
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;