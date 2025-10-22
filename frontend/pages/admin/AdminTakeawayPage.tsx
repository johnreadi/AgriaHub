import React from 'react';

const AdminTakeawayPage: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-gray-700">Gestion Vente à Emporter</h1>
            <p className="text-gray-600 mt-4">
                Cette fonctionnalité a été désactivée car aucun produit n'est actuellement proposé.
                Pour la réactiver, veuillez recréer des produits ou contacter le support technique.
            </p>
        </div>
    );
};

export default AdminTakeawayPage;
