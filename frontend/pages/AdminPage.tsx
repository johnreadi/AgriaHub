import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../src/components/auth/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../src/contexts/AuthContext';

const AdminPage: React.FC = () => {
    const { logout } = useAuth();

    useEffect(() => {
        // Redirect to dashboard if already on #admin
        if(window.location.hash === '#admin' || window.location.hash === '#admin/') {
            window.location.hash = '#admin/dashboard';
        }
    }, []);

    const handleLogout = () => {
        logout();
        window.location.hash = '#';
    };

    return (
        <ProtectedRoute>
            <AdminLayout onLogout={handleLogout} />
        </ProtectedRoute>
    );
};

export default AdminPage;