import React, { useState, useEffect } from 'react';
import { ImageIcon } from '../../components/icons/Icons';
import { useToast } from '../../components/ToastProvider';

const TRAITEUR_PAGE_KEY = 'agria-traiteur-page-content';

interface TraiteurCard {
    title: string;
    description: string;
    image?: string;
}

interface TraiteurPageContent {
    mainHeading: string;
    mainParagraph: string;
    mainBackgroundType: 'color' | 'image' | 'video';
    mainBackgroundValue: string;
    cards: TraiteurCard[];
    ctaHeading: string;
    ctaParagraph: string;
}

const DEFAULT_TRAITEUR_CONTENT: TraiteurPageContent = {
    mainHeading: "Organisez vos événements professionnels",
    mainParagraph: "L'AGRIA met son savoir-faire et la qualité de ses produits au service de vos événements d'entreprise. Séminaires, réunions, pots de départ ou cocktails, nous concevons avec vous des prestations sur mesure pour garantir la réussite de vos réceptions.",
    mainBackgroundType: 'image',
    mainBackgroundValue: 'https://source.unsplash.com/random/1200x400/?catering,food,event',
    cards: [
        { title: "Pauses-café", description: "Viennoiseries, boissons chaudes et jus de fruits pour bien démarrer la journée.", image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAEgAyADASIAAhEBAxEB/8QAGwABAQACAwEAAAAAAAAAAAAAAAEGBwIDBAX/xABBEAABAwIFAgMGBAMIAQQDAAABAAIDBBEFEgYhMUETIlFhcYEHFDJCkaGxIzNSYnLR4UKC8BVSFxgkNGOCstLi/QAGAEBAQEBAQAAAAAAAAAAAAAAAAECAwT/xAAhEQEBAAICAgMBAQEAAAAAAAAAAQIRITEDEkFRIgNCYf/aAAwDAQACEQMRAD8A9UoiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAibGFwA=" },
        { title: "Moments de convivialité", description: "Un assortiment de pièces salées et sucrées pour des moments conviviaux.", image: "https://source.unsplash.com/random/400x300/?cocktail,buffet" }
    ],
    ctaHeading: "Un projet ? Une question ?",
    ctaParagraph: "Contactez-nous pour discuter de vos besoins et obtenir un devis personnalisé."
};

const AdminTraiteurPage: React.FC = () => {
    const [content, setContent] = useState<TraiteurPageContent>(DEFAULT_TRAITEUR_CONTENT);
    const { addToast } = useToast();

    useEffect(() => {
        try {
            const savedContent = localStorage.getItem(TRAITEUR_PAGE_KEY);
            if (savedContent) {
                setContent(JSON.parse(savedContent));
            } else {
                setContent(DEFAULT_TRAITEUR_CONTENT);
            }
        } catch (e) {
            console.error("Failed to load traiteur page content", e);
            setContent(DEFAULT_TRAITEUR_CONTENT);
        }
    }, []);
    
    const handleSave = () => {
        localStorage.setItem(TRAITEUR_PAGE_KEY, JSON.stringify(content));
        addToast('Contenu sauvegardé avec succès !', 'success');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setContent(prev => ({ ...prev, [name]: value }));
    };

    const handleBackgroundChange = (field: 'mainBackgroundType' | 'mainBackgroundValue', value: any) => {
        setContent(prev => ({ ...prev, [field]: value }));
    };

    const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileType = content.mainBackgroundType;
            const sizeLimit = fileType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for video, 5MB for image

            if (file.size > sizeLimit) {
                addToast(`Le fichier est trop volumineux. La taille maximale est de ${sizeLimit / 1024 / 1024} Mo.`, 'error');
                return;
            }

            if (fileType === 'image' && !file.type.startsWith('image/')) {
                addToast('Veuillez sélectionner un fichier image valide.', 'error');
                return;
            }
            if (fileType === 'video' && !file.type.startsWith('video/')) {
                addToast('Veuillez sélectionner un fichier vidéo valide.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                handleBackgroundChange('mainBackgroundValue', reader.result as string);
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset input
        }
    };


    const handleCardChange = (index: number, field: 'title' | 'description', value: string) => {
        const newCards = [...content.cards];
        newCards[index] = { ...newCards[index], [field]: value };
        setContent(prev => ({...prev, cards: newCards}));
    };

    const handleCardImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                addToast("L'image est trop grande. La taille maximale est de 2 Mo.", 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const newCards = [...content.cards];
                newCards[index] = { ...newCards[index], image: reader.result as string };
                setContent(prev => ({ ...prev, cards: newCards }));
            };
            reader.readAsDataURL(file);
        }
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
             <h1 className="text-3xl font-bold text-gray-700 mb-6">Gestion de la Page "Prestations Traiteur"</h1>
            
            <div className="space-y-8">
                {/* Section Principale */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Section principale</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="mainHeading" className="block text-sm font-medium text-gray-700">Titre principal</label>
                            <input type="text" name="mainHeading" id="mainHeading" value={content.mainHeading} onChange={handleInputChange} className="mt-1 block w-full input-style"/>
                        </div>
                        <div>
                             <label htmlFor="mainParagraph" className="block text-sm font-medium text-gray-700">Paragraphe d'introduction</label>
                             <textarea name="mainParagraph" id="mainParagraph" value={content.mainParagraph} onChange={handleInputChange} rows={4} className="mt-1 block w-full input-style"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Arrière-plan de la section</label>
                            <div className="mt-2 flex gap-4">
                                <label className="flex items-center">
                                    <input type="radio" name="mainBackgroundType" value="color" checked={content.mainBackgroundType === 'color'} onChange={() => handleBackgroundChange('mainBackgroundType', 'color')} className="form-radio h-4 w-4 text-agria-green focus:ring-agria-green" />
                                    <span className="ml-2">Couleur</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="mainBackgroundType" value="image" checked={content.mainBackgroundType === 'image'} onChange={() => handleBackgroundChange('mainBackgroundType', 'image')} className="form-radio h-4 w-4 text-agria-green focus:ring-agria-green" />
                                    <span className="ml-2">Image</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="mainBackgroundType" value="video" checked={content.mainBackgroundType === 'video'} onChange={() => handleBackgroundChange('mainBackgroundType', 'video')} className="form-radio h-4 w-4 text-agria-green focus:ring-agria-green" />
                                    <span className="ml-2">Vidéo</span>
                                </label>
                            </div>
                            <div className="mt-2">
                                {content.mainBackgroundType === 'color' && (
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={content.mainBackgroundValue} onChange={(e) => handleBackgroundChange('mainBackgroundValue', e.target.value)} className="p-1 h-10 w-12 block bg-white border border-gray-300 rounded-md cursor-pointer" />
                                        <input type="text" value={content.mainBackgroundValue} onChange={(e) => handleBackgroundChange('mainBackgroundValue', e.target.value)} className="input-style w-full" placeholder="#ffffff"/>
                                    </div>
                                )}
                                {(content.mainBackgroundType === 'image' || content.mainBackgroundType === 'video') && (
                                    <div className="space-y-2">
                                        <input type="text" value={content.mainBackgroundValue && !content.mainBackgroundValue.startsWith('data:') ? content.mainBackgroundValue : ''} onChange={(e) => handleBackgroundChange('mainBackgroundValue', e.target.value)} className="input-style w-full" placeholder="Coller une URL ou charger un fichier local"/>
                                        
                                        <label htmlFor="bg-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 inline-block">
                                            {`Charger une ${content.mainBackgroundType === 'image' ? 'image' : 'vidéo'} locale`}
                                            <input id="bg-upload" type="file" className="hidden" accept={`${content.mainBackgroundType}/*`} onChange={handleBackgroundFileChange} />
                                        </label>
                                        
                                        <div className="w-full h-24 bg-gray-100 border rounded flex items-center justify-center overflow-hidden">
                                            {content.mainBackgroundValue ? (
                                                content.mainBackgroundType === 'image' ? (
                                                    <img src={content.mainBackgroundValue} alt="Aperçu" className="h-full w-full object-cover"/>
                                                ) : (
                                                    <video key={content.mainBackgroundValue} src={content.mainBackgroundValue} className="h-full w-full object-cover" autoPlay loop muted playsInline />
                                                )
                                            ) : (
                                                <span className="text-xs text-gray-400">Aperçu</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Cartes de service */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Cartes de service</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {content.cards.map((card, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                    <label className="cursor-pointer">
                                        <div className="w-full h-32 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-500 transition-colors bg-white">
                                            {card.image ? (
                                                <img src={card.image} alt={card.title || 'Aperçu'} className="w-full h-full object-cover rounded-md" />
                                            ) : (
                                                <div className="text-center">
                                                    <ImageIcon className="mx-auto h-8 w-8" />
                                                    <span className="text-xs mt-1 block">Ajouter une image</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            className="hidden"
                                            onChange={(e) => handleCardImageChange(index, e)}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <label htmlFor={`card-title-${index}`} className="block text-sm font-medium text-gray-700">Titre de la carte {index+1}</label>
                                    <input type="text" id={`card-title-${index}`} value={card.title} onChange={e => handleCardChange(index, 'title', e.target.value)} className="mt-1 block w-full input-style"/>
                                </div>
                                <div>
                                    <label htmlFor={`card-desc-${index}`} className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea id={`card-desc-${index}`} value={card.description} onChange={e => handleCardChange(index, 'description', e.target.value)} rows={3} className="mt-1 block w-full input-style"></textarea>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                
                 {/* Section Appel à l'action */}
                <section>
                     <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Appel à l'action (CTA)</h2>
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="ctaHeading" className="block text-sm font-medium text-gray-700">Titre du CTA</label>
                            <input type="text" name="ctaHeading" id="ctaHeading" value={content.ctaHeading} onChange={handleInputChange} className="mt-1 block w-full input-style"/>
                        </div>
                        <div>
                             <label htmlFor="ctaParagraph" className="block text-sm font-medium text-gray-700">Texte du CTA</label>
                             <input type="text" name="ctaParagraph" id="ctaParagraph" value={content.ctaParagraph} onChange={handleInputChange} className="mt-1 block w-full input-style"/>
                        </div>
                    </div>
                </section>

                <div className="pt-4">
                     <button onClick={handleSave} className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Sauvegarder les modifications
                    </button>
                </div>
            </div>
            <style>{`.input-style {padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem;} .input-style:focus {outline: 2px solid transparent; outline-offset: 2px; border-color: #009A58; box-shadow: 0 0 0 2px #009A58;} .form-radio {color: #009A58;}`}</style>
        </div>
    );
};

export default AdminTraiteurPage;