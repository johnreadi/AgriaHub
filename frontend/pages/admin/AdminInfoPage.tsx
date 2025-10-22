import React, { useState, useEffect } from 'react';
import { PlusCircleIcon, TrashIcon } from '../../components/icons/Icons';

const INFO_PAGE_KEY = 'agria-info-page-content';

interface InfoPageContent {
    transportItems: string[];
}

const DEFAULT_INFO_CONTENT: InfoPageContent = {
    transportItems: [
        "Bus T4 - Arrêt \"Martainville\"",
        "Métro - Station \"Joffre-Mutualité\" (10 min à pied)"
    ]
};

const AdminInfoPage: React.FC = () => {
    const [content, setContent] = useState<InfoPageContent>(DEFAULT_INFO_CONTENT);
    const [notification, setNotification] = useState<string>('');

    useEffect(() => {
        try {
            const savedContent = localStorage.getItem(INFO_PAGE_KEY);
            if (savedContent) {
                setContent(JSON.parse(savedContent));
            } else {
                setContent(DEFAULT_INFO_CONTENT);
            }
        } catch (e) {
            console.error("Failed to load info page content", e);
            setContent(DEFAULT_INFO_CONTENT);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem(INFO_PAGE_KEY, JSON.stringify(content));
        setNotification('Contenu sauvegardé avec succès !');
        setTimeout(() => setNotification(''), 3000);
    };

    const handleTransportChange = (index: number, value: string) => {
        const newItems = [...content.transportItems];
        newItems[index] = value;
        setContent(prev => ({ ...prev, transportItems: newItems }));
    };

    const addTransportItem = () => {
        setContent(prev => ({ ...prev, transportItems: [...prev.transportItems, ''] }));
    };

    const removeTransportItem = (index: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
            const newItems = content.transportItems.filter((_, i) => i !== index);
            setContent(prev => ({ ...prev, transportItems: newItems }));
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-gray-700 mb-6">Gestion de la Page "Infos Utiles"</h1>
            {notification && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{notification}</div>}
            
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Transports en commun</h2>
                    <p className="text-sm text-gray-500 mb-4">Gérez la liste des transports affichés sur la page. Les informations générales (adresse, horaires) se gèrent dans les Paramètres.</p>
                    <div className="space-y-2">
                        {content.transportItems.map((item, index) => (
                             <div key={index} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleTransportChange(index, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-agria-green"
                                    placeholder="Ex: Bus T1 - Arrêt Central"
                                />
                                <button onClick={() => removeTransportItem(index)} className="text-red-500 hover:text-red-700 p-2" title="Supprimer">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                     <button onClick={addTransportItem} className="mt-2 text-agria-green hover:text-agria-green-dark font-semibold flex items-center gap-2">
                        <PlusCircleIcon /> Ajouter un transport
                    </button>
                </div>
                
                <hr />

                <div className="pt-4">
                    <button onClick={handleSave} className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Sauvegarder les modifications
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminInfoPage;