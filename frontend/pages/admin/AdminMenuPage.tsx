import React, { useState, useEffect, useCallback } from 'react';
import type { DayOfWeek, WeeklyMenu, MenuItem, MenuCategory } from '../../types';
import { SpinnerIcon, PlusCircleSolidIcon, TrashSolidIcon, ImageSolidIcon, UploadIcon, LinkIcon, CloseIcon, PencilIcon } from '../../components/icons/Icons';
import { useToast } from '../../components/ToastProvider';
import apiService from '../../src/services/api';

// ... existing code ...

// --- Reusable ImageUploaderModal (copied from AdminRestaurantPage for consistency) ---
interface ImageUploaderModalProps { isOpen: boolean; onClose: () => void; onSave: (url: string | null) => void; currentImage?: string; }
const ImageUploaderModal: React.FC<ImageUploaderModalProps> = ({ isOpen, onClose, onSave, currentImage }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [url, setUrl] = useState('');
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const { addToast } = useToast();

    useEffect(() => {
        setPreview(currentImage || null);
        if (currentImage && !currentImage.startsWith('data:')) {
            setUrl(currentImage);
            setActiveTab('url');
        } else {
            setUrl('');
            setActiveTab('upload');
        }
    }, [isOpen, currentImage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { addToast("L'image est trop lourde (max 2 Mo).", 'error'); return; }
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    const handleUrlBlur = () => { if (url.match(/\.(jpeg|jpg|gif|png|webp)$/)) setPreview(url); };
    const handleSave = () => { onSave(activeTab === 'url' ? url : preview); onClose(); };
    const handleRemove = () => { onSave(null); onClose(); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center"><h3 className="text-lg font-bold">Gérer l'image</h3><button onClick={onClose}><CloseIcon className="h-5 w-5"/></button></div>
                <div className="p-4">
                    <div className="flex border-b mb-4">
                        <button onClick={() => setActiveTab('upload')} className={`py-2 px-4 flex items-center gap-2 ${activeTab === 'upload' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}><UploadIcon className="h-5 w-5"/> Importer</button>
                        <button onClick={() => setActiveTab('url')} className={`py-2 px-4 flex items-center gap-2 ${activeTab === 'url' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}><LinkIcon className="h-5 w-5"/> Lien URL</button>
                    </div>
                    {activeTab === 'upload' ? (
                        <input type="file" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    ) : (
                        <input type="url" value={url} onChange={e => setUrl(e.target.value)} onBlur={handleUrlBlur} placeholder="https://exemple.com/image.jpg" className="w-full p-2 border border-gray-300 rounded"/>
                    )}
                    <div className="mt-4 w-full h-40 bg-gray-100 rounded border flex items-center justify-center">
                        {preview ? <img src={preview} alt="Aperçu" className="max-h-full max-w-full object-contain"/> : <span className="text-gray-400">Aperçu</span>}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-between rounded-b-lg">
                    <button onClick={handleRemove} className="text-red-600 hover:text-red-800 font-semibold">Supprimer l'image</button>
                    <div>
                        <button onClick={onClose} className="py-2 px-4 rounded font-semibold mr-2">Annuler</button>
                        <button onClick={handleSave} className="bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700">Valider</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AdminMenuPage: React.FC = () => {
    const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imageModalState, setImageModalState] = useState<{ isOpen: boolean; day: DayOfWeek; catIndex: number; itemIndex: number; } | null>(null);
    const days: DayOfWeek[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
    const { addToast } = useToast();
    const jsonImportRef = React.useRef<HTMLInputElement>(null);

    const fetchMenu = useCallback(async () => {
        setIsLoading(true);
        try {
            // Essayer de récupérer le menu depuis l'API
            const apiResp = await apiService.getMenu();
            const menuData = (apiResp && typeof apiResp === 'object' && 'menu' in apiResp) ? (apiResp as any).menu : apiResp;
            if (menuData && typeof menuData === 'object') {
                // Assurer que tous les items ont un ID
                Object.values(menuData).forEach((dayCategories: any) => {
                    // Vérifier que dayCategories est un tableau avant d'utiliser forEach
                    if (Array.isArray(dayCategories)) {
                        dayCategories.forEach((category: MenuCategory) => {
                            if (category && category.items && Array.isArray(category.items)) {
                                category.items.forEach((item) => {
                                    if (!item.id) {
                                        item.id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                                    }
                                });
                            }
                        });
                    }
                });
                setWeeklyMenu(menuData as WeeklyMenu);
                addToast("Menu chargé depuis la base de données.", 'success');
            } else {
                // Ne plus utiliser localStorage: si l'API ne retourne rien, afficher l'état vide
                setWeeklyMenu(null);
                addToast("Aucun menu actif retourné par l'API.", 'info');
            }
        } catch (error) {
            console.error('Erreur lors du chargement du menu:', error);
            addToast("Erreur lors du chargement du menu depuis l'API.", 'error');
            // Ne plus faire de fallback localStorage
            setWeeklyMenu(null);
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);
    
    const handleCreateEmptyMenu = () => {
        const emptyMenu: WeeklyMenu = {} as WeeklyMenu;
        days.forEach(day => {
            emptyMenu[day] = [
                { title: 'ENTRÉES', items: [] },
                { title: 'PLATS', items: [] },
                { title: 'LÉGUMES', items: [] },
                { title: 'DESSERTS', items: [] }
            ];
        });
        setWeeklyMenu(emptyMenu);
        addToast("Menu vierge créé. Vous pouvez commencer à le remplir.", 'info');
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const importedMenu = JSON.parse(text);
                if (typeof importedMenu === 'object' && importedMenu !== null && days.every(day => day in importedMenu)) {
                    setWeeklyMenu(importedMenu);
                    addToast("Menu importé avec succès !", 'success');
                } else {
                    throw new Error("Format de fichier JSON invalide.");
                }
            } catch (error) {
                console.error("Erreur d'importation JSON:", error);
                addToast("Échec de l'importation. Le fichier est peut-être corrompu ou mal formaté.", 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleInputChange = (day: DayOfWeek, catIndex: number, itemIndex: number, value: string) => {
        setWeeklyMenu(currentMenu => {
            if (!currentMenu) return null;
            const newMenu = JSON.parse(JSON.stringify(currentMenu));
            newMenu[day][catIndex].items[itemIndex].name = value;
            return newMenu;
        });
    };

    const handleSaveImage = (imageUrl: string | null) => {
        if (!imageModalState) return;
        const { day, catIndex, itemIndex } = imageModalState;

        setWeeklyMenu(currentMenu => {
            if (!currentMenu) return null;
            const newMenu = JSON.parse(JSON.stringify(currentMenu));
            newMenu[day][catIndex].items[itemIndex].image = imageUrl === null ? undefined : imageUrl;
            return newMenu;
        });
        setImageModalState(null);
    };

    const handleAddItem = (day: DayOfWeek, catIndex: number) => {
        setWeeklyMenu(currentMenu => {
            if (!currentMenu) return null;
            const newMenu = JSON.parse(JSON.stringify(currentMenu));
            newMenu[day][catIndex].items.push({ 
                id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
                name: '', 
                image: undefined 
            });
            return newMenu;
        });
    };
    
    const handleDeleteItem = (day: DayOfWeek, catIndex: number, itemIndex: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
            setWeeklyMenu(currentMenu => {
                if (!currentMenu) return null;
                const newMenu = JSON.parse(JSON.stringify(currentMenu));
                newMenu[day][catIndex].items = newMenu[day][catIndex].items.filter((_: MenuItem, index: number) => index !== itemIndex);
                return newMenu;
            });
        }
    };

    const handleSave = async () => {
        if (weeklyMenu) {
            const cleanedMenu = JSON.parse(JSON.stringify(weeklyMenu));
            Object.keys(cleanedMenu).forEach(day => {
                cleanedMenu[day].forEach((category: any) => {
                    category.items = category.items.filter((item: any) => item.name.trim() !== '');
                });
            });

            try {
                // Sauvegarder via l'API
                await apiService.saveMenu(cleanedMenu);
                setWeeklyMenu(cleanedMenu);
                addToast('Menu sauvegardé avec succès dans la base de données ! Il est maintenant visible sur le site public.', 'success');
                // Ne plus sauvegarder en local
            } catch (error) {
                console.error('Erreur lors de la sauvegarde du menu:', error);
                addToast('Erreur lors de la sauvegarde dans la base de données.', 'error');
                // Ne plus faire de fallback localStorage
                setWeeklyMenu(cleanedMenu);
            }
        }
    };
    
    const currentEditingItem = imageModalState?.isOpen && weeklyMenu
      ? weeklyMenu[imageModalState.day][imageModalState.catIndex].items[imageModalState.itemIndex]
      : undefined;

    const renderNoMenuState = () => (
        <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-700">Aucun menu n'est actuellement défini.</h2>
            <p className="text-gray-500 mt-2 mb-6">Choisissez une option pour commencer.</p>
            <div className="flex flex-wrap justify-center gap-4">
                 <button 
                    onClick={handleCreateEmptyMenu}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 inline-flex items-center gap-3 shadow-md"
                >
                    <PencilIcon />
                    Créer un menu vierge
                </button>
                 <button 
                    onClick={() => jsonImportRef.current?.click()}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 inline-flex items-center gap-3 shadow-md"
                >
                    <UploadIcon />
                    Importer (JSON)
                </button>
                <input type="file" ref={jsonImportRef} className="hidden" accept=".json" onChange={handleFileImport} />
            </div>
        </div>
    );

    const renderMenuEditor = () => (
        <div className="space-y-8">
            {weeklyMenu && days.map(day => (
                <div key={day}>
                    <h3 className="text-2xl font-bold text-agria-green mb-4 border-b-2 border-agria-green pb-2">{day}</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {weeklyMenu[day]?.map((category, catIndex) => (
                            <div key={category.title}>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-lg text-gray-700 uppercase">{category.title}</h4>
                                    <button onClick={() => handleAddItem(day, catIndex)} className="text-agria-green hover:text-agria-green-dark" title="Ajouter un plat">
                                        <PlusCircleSolidIcon className="h-7 w-7"/>
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {category.items.map((item, itemIndex) => (
                                        <div key={item.id} className="flex items-center border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-agria-green transition-all duration-200 overflow-hidden">
                                            <button onClick={() => setImageModalState({isOpen: true, day, catIndex, itemIndex})} className="flex-shrink-0 cursor-pointer w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name || 'Menu item'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageSolidIcon className="h-5 w-5" />
                                                )}
                                            </button>
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleInputChange(day, catIndex, itemIndex, e.target.value)}
                                                className="w-full px-2 py-2 border-0 bg-transparent focus:ring-0 text-sm"
                                                placeholder="Nouveau plat..."
                                            />
                                            <button onClick={() => handleDeleteItem(day, catIndex, itemIndex)} className="p-2 text-gray-500 hover:text-red-600" title="Supprimer">
                                                <TrashSolidIcon className="h-5 w-5"/>
                                            </button>
                                        </div>
                                    ))}
                                    {category.items.length === 0 && <p className="text-sm text-gray-400 italic px-2">Aucun plat.</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-4xl font-bold font-serif text-gray-800">Gestion du Menu de la Semaine</h1>
                {weeklyMenu && (
                    <div className="flex flex-wrap gap-4">
                        <button 
                            onClick={handleSave}
                            className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md transform hover:scale-105"
                        >
                            Sauvegarder et Publier
                        </button>
                    </div>
                )}
            </div>

            {isLoading ? <div className="flex justify-center items-center h-64"><SpinnerIcon size="large" /></div> : (weeklyMenu ? renderMenuEditor() : renderNoMenuState())}
            
            <ImageUploaderModal 
                isOpen={!!imageModalState?.isOpen}
                onClose={() => setImageModalState(null)}
                onSave={handleSaveImage}
                currentImage={currentEditingItem?.image}
            />
        </div>
    );
};

export default AdminMenuPage;