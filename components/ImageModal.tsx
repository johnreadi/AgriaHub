import React, { useEffect } from 'react';
import { CloseIcon } from './icons/Icons';

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    altText?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, altText = 'Image en grand' }) => {
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

    if (!isOpen || !imageUrl) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                <img src={imageUrl} alt={altText} className="object-contain max-w-full max-h-[90vh] rounded-lg" />
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-agria-green"
                    aria-label="Fermer"
                >
                    <CloseIcon className="h-6 w-6" />
                </button>
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

export default ImageModal;
