import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import type { Toast } from '../types';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, CloseIcon } from './icons/Icons';

type ToastContextType = {
    addToast: (message: string, type: Toast['type']) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastComponent: React.FC<{ toast: Toast, onClose: () => void }> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const ICONS = {
        success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
        error: <XCircleIcon className="h-6 w-6 text-red-500" />,
        info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
    };

    const icon = ICONS[toast.type];
    const borderClass = {
        success: 'border-green-500',
        error: 'border-red-500',
        info: 'border-blue-500',
    }[toast.type];

    return (
        <div className={`toast-item bg-white rounded-lg shadow-2xl p-4 m-2 w-full max-w-sm border-l-4 ${borderClass} flex items-start gap-4`}>
            <div className="flex-shrink-0">{icon}</div>
            <p className="flex-grow text-sm text-gray-700 font-medium">{toast.message}</p>
            <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-700">
                <CloseIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

const ToastContainer: React.FC<{ toasts: Toast[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    const portalRoot = document.getElementById('toast-portal');

    if (!portalRoot) return null;

    return ReactDOM.createPortal(
        <div className="fixed top-4 right-4 z-[9999] space-y-2">
             <style>{`
                .toast-item {
                    animation: toast-slide-in 0.3s ease-out forwards;
                }
                @keyframes toast-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
            {toasts.map(toast => (
                <ToastComponent key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>,
        portalRoot
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type']) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};