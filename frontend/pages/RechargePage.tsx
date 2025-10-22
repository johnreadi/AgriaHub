import React from 'react';
import { CreditCardIcon } from '../components/icons/Icons';

const RechargePage: React.FC = () => {

    return (
        <div className="text-center">
            <CreditCardIcon className="h-16 w-16 mx-auto text-agria-green mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Recharger ma carte</h1>
            <p className="text-gray-600 mb-6">
                Pour recharger votre carte en ligne, vous allez être redirigé vers notre portail de paiement sécurisé Moneweb.
            </p>
            
            <a 
                href="https://agriarouen.moneweb.fr/clients#/login"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-block bg-agria-green hover:bg-agria-green-dark text-white font-bold py-3 px-4 text-lg rounded-lg transition-all duration-300 shadow-md transform hover:scale-105"
            >
                Recharger ma carte
            </a>
        </div>
    );
};

export default RechargePage;