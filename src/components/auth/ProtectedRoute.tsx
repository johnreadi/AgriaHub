import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    // Debug logs
    console.log('ProtectedRoute state:', { isAuthenticated, isLoading });

    if (isLoading) {
        console.log('ProtectedRoute: showing loading spinner');
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('ProtectedRoute: user not authenticated, showing login form');
        return <LoginForm />;
    }

    console.log('ProtectedRoute: user authenticated, rendering children');
    return <>{children}</>;
};

export default ProtectedRoute;