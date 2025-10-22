import React from 'react';
import type { CartItem } from '../types';
import { TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon } from './icons/Icons';

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (productId: number, newQuantity: number) => void;
    onRemoveItem: (productId: number) => void;
    onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onRemoveItem, onCheckout }) => {
    const totalPrice = items.reduce((total, item) => total + item.product.price * item.quantity, 0);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-3 border-b-2 flex items-center gap-3">
                <ShoppingBagIcon className="h-7 w-7 text-agria-green"/>
                Mon Panier
            </h2>

            {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Votre panier est vide.</p>
            ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {items.map(item => (
                        <div key={item.product.id} className="flex items-center gap-4">
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-700">{item.product.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded-full border border-gray-300 hover:bg-gray-100">
                                        <MinusIcon className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                                    <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="p-1 rounded-full border border-gray-300 hover:bg-gray-100">
                                        <PlusIcon className="h-4 w-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-gray-800">{(item.product.price * item.quantity).toFixed(2)} €</p>
                                 <button onClick={() => onRemoveItem(item.product.id)} className="text-red-400 hover:text-red-600 mt-1">
                                    <TrashIcon className="h-4 w-4"/>
                                 </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {items.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center font-bold text-xl mb-4">
                        <span>Total</span>
                        <span>{totalPrice.toFixed(2)} €</span>
                    </div>
                    <button 
                        onClick={onCheckout}
                        className="w-full bg-agria-green hover:bg-agria-green-dark text-white font-semibold py-3 px-4 rounded-md transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={items.length === 0}
                    >
                        Commandez votre panier repas
                    </button>
                </div>
            )}
        </div>
    );
};

export default Cart;
