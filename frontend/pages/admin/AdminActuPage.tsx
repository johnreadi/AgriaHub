import React, { useState, useEffect, useCallback } from 'react';
import type { ActuItem } from '../../types';
import { INITIAL_ACTU_DATA } from '../../constants';

const ACTU_STORAGE_KEY = 'agria-actu';

const AdminActuPage: React.FC = () => {
    const [actuItems, setActuItems] = useState<ActuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<ActuItem | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const loadActu = useCallback(() => {
        try {
            const savedActu = localStorage.getItem(ACTU_STORAGE_KEY);
            if (savedActu) {
                setActuItems(JSON.parse(savedActu));
            } else {
                setActuItems(INITIAL_ACTU_DATA);
                localStorage.setItem(ACTU_STORAGE_KEY, JSON.stringify(INITIAL_ACTU_DATA));
            }
        } catch (error) {
            console.error("Failed to load news from localStorage", error);
            setActuItems(INITIAL_ACTU_DATA);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadActu();
    }, [loadActu]);

    const handleSave = (itemToSave: ActuItem) => {
        let updatedItems;
        if (actuItems.find(item => item.id === itemToSave.id)) {
            // Edit existing
            updatedItems = actuItems.map(item => item.id === itemToSave.id ? itemToSave : item);
        } else {
            // Add new
            updatedItems = [...actuItems, itemToSave];
        }
        setActuItems(updatedItems);
        localStorage.setItem(ACTU_STORAGE_KEY, JSON.stringify(updatedItems));
        closeForm();
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Êtes-vous sûr de vouloir supprimer cette actualité ?")) {
            const updatedItems = actuItems.filter(item => item.id !== id);
            setActuItems(updatedItems);
            localStorage.setItem(ACTU_STORAGE_KEY, JSON.stringify(updatedItems));
        }
    };

    const openFormForNew = () => {
        setEditingItem({ id: Date.now().toString(), title: '', content: '', date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric'}) });
        setIsFormVisible(true);
    };

    const openFormForEdit = (item: ActuItem) => {
        setEditingItem(item);
        setIsFormVisible(true);
    };

    const closeForm = () => {
        setEditingItem(null);
        setIsFormVisible(false);
    };

    if (isFormVisible && editingItem) {
        return <ActuForm item={editingItem} onSave={handleSave} onCancel={closeForm} />;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-700">Gestion des Actualités</h1>
                <button onClick={openFormForNew} className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Ajouter une actualité
                </button>
            </div>
             {isLoading ? <p>Chargement...</p> : (
                <div className="space-y-4">
                    {actuItems.map(item => (
                        <div key={item.id} className="p-4 border rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.date}</p>
                            </div>
                            <div className="space-x-2">
                                <button onClick={() => openFormForEdit(item)} className="text-blue-500 hover:underline">Modifier</button>
                                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline">Supprimer</button>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );
};

// Form component for adding/editing news
const ActuForm: React.FC<{item: ActuItem, onSave: (item: ActuItem) => void, onCancel: () => void}> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
             <h2 className="text-2xl font-bold text-gray-700 mb-6">{item.id ? "Modifier" : "Ajouter"} une actualité</h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                     <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre</label>
                     <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-agria-green"/>
                 </div>
                 <div>
                     <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                     <input type="text" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-agria-green"/>
                 </div>
                 <div>
                     <label htmlFor="content" className="block text-sm font-medium text-gray-700">Contenu</label>
                     <textarea name="content" id="content" value={formData.content} onChange={handleChange} rows={5} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-agria-green"></textarea>
                 </div>
                 <div className="flex justify-end space-x-4">
                     <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Annuler</button>
                     <button type="submit" className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-4 rounded-lg">Sauvegarder</button>
                 </div>
             </form>
        </div>
    );
}

export default AdminActuPage;