import React from 'react';

const TakeawayPage: React.FC = () => {

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith('#')) {
            e.preventDefault();
            window.location.hash = href;
        }
    };

    return (
        <div className="container mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Vente à emporter</h1>
            <div className="my-8">
                <a 
                    href="https://app.agriarouen.fr/vente-emporter" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 inline-block text-lg"
                >
                    Commander votre panier repas
                </a>
            </div>
            <a href="#" onClick={(e) => handleNavClick(e, '#')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-2 rounded-md transition-colors">
                Retour à l'accueil
            </a>
        </div>
    );
};

export default TakeawayPage;