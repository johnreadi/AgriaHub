import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/Icons';
import type { CartItem, Conversation } from '../types';
import { MESSAGES_STORAGE_KEY, MOCK_CONVERSATIONS } from '../constants';

interface TakeawayModalProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    onOrderSuccess: () => void;
}

const TakeawayModal: React.FC<TakeawayModalProps> = ({ isOpen, onClose, cartItems, onOrderSuccess }) => {
    
    const totalPrice = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const firstname = formData.get('firstname') as string;
        const lastname = formData.get('lastname') as string;
        const email = formData.get('email') as string;
        const agriaCard = formData.get('agria-card') as string;
        const name = `${firstname} ${lastname}`;

        const orderSummaryForMessage = cartItems.map(item => `- ${item.quantity}x ${item.product.name}`).join('\n');
        const messageText = `Nouvelle commande à emporter de ${name}.\n\nInformations client :\n- Email : ${email}\n- N° Carte Agria : ${agriaCard}\n\nRécapitulatif de la commande :\n${orderSummaryForMessage}\n\nTotal: ${totalPrice.toFixed(2)} €`;

        // Save to messaging system
        try {
            const existingConversationsRaw = localStorage.getItem(MESSAGES_STORAGE_KEY);
            let allConversations: Conversation[] = [];

            if (existingConversationsRaw) {
                allConversations = JSON.parse(existingConversationsRaw);
            } else {
                allConversations = MOCK_CONVERSATIONS;
            }

            const newConversation: Conversation = {
                id: `conv-order-${Date.now()}`,
                userId: Date.now(), // Mock user ID
                userName: name,
                userEmail: email,
                subject: `Commande à emporter - Total ${totalPrice.toFixed(2)} €`,
                isRead: false,
                lastMessageTimestamp: new Date().toISOString(),
                messages: [{
                    id: `msg-${Date.now()}`,
                    sender: 'user',
                    text: messageText,
                    timestamp: new Date().toISOString()
                }]
            };
            
            allConversations.unshift(newConversation);
            localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(allConversations));

        } catch (error) {
            console.error("Failed to save order as message:", error);
            // Non-blocking error
        }

        const alertMessage = `Votre commande a été confirmée !\n\nRécapitulatif:\n${cartItems.map(item => `- ${item.quantity}x ${item.product.name}`).join('\n')}\n\nTotal: ${totalPrice.toFixed(2)} €\n\nVous pourrez la retirer et la payer à la cafétéria demain entre 11h45 et 14h15.`;
        
        alert(alertMessage);
        onOrderSuccess();
    };

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    if (!isOpen) return null;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toLocaleDateString('fr-FR');


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all animate-slide-up overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-2xl font-bold font-serif text-gray-800">Finaliser ma commande</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </header>

                <div className="max-h-[80vh] overflow-y-auto">
                    {/* Order Summary */}
                    <div className="p-6 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Récapitulatif du panier</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {cartItems.map(item => (
                                <div key={item.product.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">{item.quantity} x {item.product.name}</span>
                                    <span className="font-medium text-gray-800">{(item.product.price * item.quantity).toFixed(2)} €</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg pt-3 border-t mt-3">
                            <span>Total</span>
                            <span>{totalPrice.toFixed(2)} €</span>
                        </div>
                    </div>


                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nom <span className="text-gray-400 font-normal">(obligatoire)</span></label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    name="firstname"
                                    placeholder="Prénom"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agria-green"
                                />
                                <input
                                    type="text"
                                    name="lastname"
                                    placeholder="Nom de famille"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agria-green"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">E-mail <span className="text-gray-400 font-normal">(obligatoire)</span></label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agria-green"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="pickup-date" className="block text-sm font-semibold text-gray-700 mb-1">Date de retrait</label>
                            <input
                                type="text"
                                id="pickup-date"
                                name="pickup-date"
                                required
                                defaultValue={tomorrowDateString}
                                readOnly
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agria-green bg-gray-100"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="agria-card" className="block text-sm font-semibold text-gray-700 mb-1">N° Carte Agria <span className="text-gray-400 font-normal">(obligatoire)</span></label>
                            <input
                                type="text"
                                id="agria-card"
                                name="agria-card"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-agria-green"
                            />
                        </div>

                        <div className="pt-4">
                            <button type="submit" className="w-full bg-agria-green hover:bg-agria-green-dark text-white font-bold py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
                                Confirmer et commander
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                .animate-slide-up { animation: slideUp 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default TakeawayModal;