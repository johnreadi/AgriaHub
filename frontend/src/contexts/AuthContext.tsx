import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (identifier: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    // Debug logs
    console.log('AuthProvider state:', { user, isAuthenticated, isLoading });

    // Check authentication status on app load
    useEffect(() => {
        console.log('AuthProvider: checking auth on mount');
        checkAuth();
    }, []);

    const checkAuth = async () => {
        console.log('AuthProvider: checkAuth called');
        setIsLoading(true);
        try {
            // Toujours tenter de récupérer l'utilisateur courant via le cookie de session (AGRIA_TOKEN)
            console.log('AuthProvider: calling getCurrentUser...');
            const response = await apiService.getCurrentUser();
            console.log('AuthProvider: getCurrentUser response:', response);
            if (response && response.user) {
                console.log('AuthProvider: User authenticated:', response.user);
                setUser(response.user);
            } else {
                console.log('AuthProvider: No user found, clearing auth');
                // Session invalide, nettoyer éventuel token local
                localStorage.removeItem('auth_token');
                setUser(null);
            }
        } catch (error) {
            console.error('AuthProvider: Auth check failed:', error);
            console.log('AuthProvider: Error status:', error.status);
            console.log('AuthProvider: Error message:', error.message);
            
            // Si c'est une erreur 401, c'est normal (utilisateur non connecté)
            // Ne pas traiter cela comme une erreur critique
            if (error.status === 401) {
                console.log('AuthProvider: User not authenticated (401), clearing auth state');
            }
            
            localStorage.removeItem('auth_token');
            setUser(null);
        } finally {
            console.log('AuthProvider: checkAuth completed, setting isLoading to false');
            setIsLoading(false);
        }
    };

    const login = async (identifier: string, password: string): Promise<boolean> => {
        try {
            const response = await apiService.login(identifier, password);
            
            // Vérifier si la connexion a réussi selon la réponse de l'API
            if (response && (response.success || response.ok)) {
                // Supporter les deux schémas: token et access_token (optionnel si cookie HttpOnly est utilisé)
                const accessToken = response.token || response.access_token;
                if (accessToken) {
                    localStorage.setItem('auth_token', accessToken);
                }
                
                // Si l'API renvoie l'utilisateur directement, l'utiliser
                if (response.user) {
                    setUser(response.user);
                    return true;
                }
                
                // Sinon, tenter de récupérer l'utilisateur courant via /auth/me (cookie)
                try {
                    const me = await apiService.getCurrentUser();
                    if (me && me.user) {
                        setUser(me.user);
                        return true;
                    }
                } catch (_) {}
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
        apiService.logout();
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};