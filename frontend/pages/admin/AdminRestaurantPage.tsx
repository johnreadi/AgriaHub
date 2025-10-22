import React, { useState, useEffect } from 'react';
import type { RestaurantSection, RestaurantValueCard, ConceptSectionData, ValuesSectionData, ConceptParagraph, ImageSectionData, VideoSectionData } from '../../types';
import { VALUES_DATA } from '../../constants';
import { useToast } from '../../components/ToastProvider';
// FIX: Import UsersIcon and ScaleIcon
import { PlusCircleIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, ImageIcon, VideoIcon, UploadIcon, LinkIcon, CloseIcon, PencilIcon, UsersIcon, ScaleIcon } from '../../components/icons/Icons';

const RESTAURANT_PAGE_KEY = 'agria-restaurant-page-content';

// --- Reusable ImageUploaderModal ---
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

// --- Section Editor Components ---
const ConceptSectionEditor: React.FC<{ section: ConceptSectionData; onUpdate: (data: Partial<ConceptSectionData>) => void; }> = ({ section, onUpdate }) => {
    const [imageModalState, setImageModalState] = useState<{ isOpen: boolean, paragraphIndex: number } | null>(null);
    const handleParagraphChange = (index: number, field: 'text' | 'imagePosition', value: string) => {
        const newParagraphs = [...section.paragraphs];
        newParagraphs[index] = { ...newParagraphs[index], [field]: value };
        onUpdate({ paragraphs: newParagraphs });
    };
    const handleImageSave = (url: string | null) => {
        if (!imageModalState) return;
        const newParagraphs = [...section.paragraphs];
        newParagraphs[imageModalState.paragraphIndex] = { ...newParagraphs[imageModalState.paragraphIndex], image: url || undefined };
        onUpdate({ paragraphs: newParagraphs });
        setImageModalState(null);
    };
    const addParagraph = () => {
        const newP: ConceptParagraph = { id: `p-${Date.now()}`, text: '', imagePosition: 'left' };
        onUpdate({ paragraphs: [...section.paragraphs, newP] });
    };
    const removeParagraph = (index: number) => {
        onUpdate({ paragraphs: section.paragraphs.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <label className="label-style">Titre de la section</label>
            <input type="text" value={section.title} onChange={(e) => onUpdate({ title: e.target.value })} className="input-style w-full"/>
            <div className="space-y-4">
                {section.paragraphs.map((p, index) => (
                    <div key={p.id} className="bg-gray-100 p-3 rounded-lg border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Paragraphe {index + 1}</label>
                                <textarea value={p.text} onChange={(e) => handleParagraphChange(index, 'text', e.target.value)} rows={6} className="input-style w-full"/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Image (Optionnel)</label>
                                <button type="button" onClick={() => setImageModalState({ isOpen: true, paragraphIndex: index })} className="w-full h-24 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:border-gray-500 transition-colors bg-white">
                                    {p.image ? <img src={p.image} alt="Aperçu" className="w-full h-full object-cover rounded-md" /> : <div className="text-center"><ImageIcon className="mx-auto h-8 w-8" /><span className="text-xs mt-1 block">Ajouter/Modifier</span></div>}
                                </button>
                                {p.image && (<div className="mt-2"><label className="block text-xs font-medium text-gray-500 mb-1">Position</label><select value={p.imagePosition || 'left'} onChange={(e) => handleParagraphChange(index, 'imagePosition', e.target.value)} className="input-style w-full text-sm"><option value="left">Gauche</option><option value="right">Droite</option></select></div>)}
                            </div>
                        </div>
                        <div className="text-right mt-2"><button onClick={() => removeParagraph(index)} className="btn-icon-danger"><TrashIcon /></button></div>
                    </div>
                ))}
            </div>
            <button onClick={addParagraph} className="btn-secondary text-sm"><PlusCircleIcon/> Ajouter un paragraphe</button>
            <ImageUploaderModal isOpen={!!imageModalState?.isOpen} onClose={() => setImageModalState(null)} onSave={handleImageSave} currentImage={imageModalState ? section.paragraphs[imageModalState.paragraphIndex].image : undefined}/>
        </div>
    );
};

const ValuesSectionEditor: React.FC<{ section: ValuesSectionData; onUpdate: (data: Partial<ValuesSectionData>) => void; }> = ({ section, onUpdate }) => {
    const [imageModalState, setImageModalState] = useState<{ isOpen: boolean, cardIndex: number } | null>(null);
    const handleCardChange = (index: number, field: 'title' | 'description', value: string) => {
        const newCards = [...section.cards];
        newCards[index] = { ...newCards[index], [field]: value };
        onUpdate({ cards: newCards });
    };
    const handleImageSave = (url: string | null) => {
        if (!imageModalState) return;
        const newCards = [...section.cards];
        newCards[imageModalState.cardIndex] = { ...newCards[imageModalState.cardIndex], image: url || undefined };
        onUpdate({ cards: newCards });
        setImageModalState(null);
    };
    const addCard = () => {
        const newCard: RestaurantValueCard = { id: `v-${Date.now()}`, title: '', description: '' };
        onUpdate({ cards: [...section.cards, newCard] });
    };
    const removeCard = (index: number) => {
        onUpdate({ cards: section.cards.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <label className="label-style">Titre de la section</label>
            <input type="text" value={section.title} onChange={(e) => onUpdate({ title: e.target.value })} className="input-style w-full"/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.cards.map((card, index) => (
                    <div key={card.id} className="bg-gray-100 p-3 rounded-lg border space-y-3">
                        <label className="block text-xs font-medium text-gray-500">Carte {index + 1}</label>
                        <input type="text" value={card.title} onChange={(e) => handleCardChange(index, 'title', e.target.value)} className="input-style w-full" placeholder="Titre"/>
                        <textarea value={card.description} onChange={(e) => handleCardChange(index, 'description', e.target.value)} rows={3} className="input-style w-full" placeholder="Description"/>
                        <button type="button" onClick={() => setImageModalState({ isOpen: true, cardIndex: index })} className="w-full h-24 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:border-gray-500 transition-colors bg-white">
                            {card.image ? <img src={card.image} alt="Aperçu" className="w-full h-full object-cover rounded-md" /> : <div className="text-center"><ImageIcon className="mx-auto h-8 w-8" /><span className="text-xs mt-1 block">Ajouter/Modifier</span></div>}
                        </button>
                        <div className="text-right"><button onClick={() => removeCard(index)} className="btn-icon-danger"><TrashIcon /></button></div>
                    </div>
                ))}
            </div>
            <button onClick={addCard} className="btn-secondary text-sm"><PlusCircleIcon/> Ajouter une carte</button>
            <ImageUploaderModal isOpen={!!imageModalState?.isOpen} onClose={() => setImageModalState(null)} onSave={handleImageSave} currentImage={imageModalState ? section.cards[imageModalState.cardIndex].image : undefined}/>
        </div>
    );
};

const ImageSectionEditor: React.FC<{ section: ImageSectionData; onUpdate: (data: Partial<ImageSectionData>) => void; }> = ({ section, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleUpdate = (field: keyof ImageSectionData, value: string) => onUpdate({ [field]: value });
    const handleImageSave = (url: string | null) => onUpdate({ imageUrl: url || '' });

    return (
        <div className="space-y-4">
            <label className="label-style">Titre (interne, non affiché)</label>
            <input type="text" value={section.title} onChange={(e) => handleUpdate('title', e.target.value)} className="input-style w-full"/>
            <button type="button" onClick={() => setIsModalOpen(true)} className="w-full h-40 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-500 transition-colors bg-white">
                {section.imageUrl ? <img src={section.imageUrl} alt="Aperçu" className="max-w-full max-h-full object-contain" /> : <div className="text-center"><ImageIcon className="mx-auto h-10 w-10" /><span className="text-sm mt-1 block">Choisir une image</span></div>}
            </button>
            <label className="label-style">Légende (Optionnel)</label>
            <input type="text" value={section.caption} onChange={(e) => handleUpdate('caption', e.target.value)} className="input-style w-full"/>
            <ImageUploaderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleImageSave} currentImage={section.imageUrl}/>
        </div>
    );
};

const VideoSectionEditor: React.FC<{ section: VideoSectionData; onUpdate: (data: Partial<VideoSectionData>) => void; }> = ({ section, onUpdate }) => {
    const handleUpdate = (field: keyof VideoSectionData, value: string) => onUpdate({ [field]: value });
    const getEmbedUrl = (url: string) => {
        if (url.includes("youtube.com/watch?v=")) {
            return url.replace("watch?v=", "embed/");
        }
        return url;
    };
    return (
        <div className="space-y-4">
            <label className="label-style">Titre (interne, non affiché)</label>
            <input type="text" value={section.title} onChange={(e) => handleUpdate('title', e.target.value)} className="input-style w-full"/>
             <label className="label-style">URL de la vidéo (ex: YouTube)</label>
            <input type="url" value={section.videoUrl} onChange={(e) => handleUpdate('videoUrl', e.target.value)} className="input-style w-full"/>
            <div className="w-full aspect-video bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                {section.videoUrl ? <iframe src={getEmbedUrl(section.videoUrl)} title="Aperçu vidéo" className="w-full h-full" frameBorder="0" allowFullScreen></iframe> : <VideoIcon className="h-12 w-12 text-gray-400"/>}
            </div>
            <label className="label-style">Légende (Optionnel)</label>
            <input type="text" value={section.caption} onChange={(e) => handleUpdate('caption', e.target.value)} className="input-style w-full"/>
        </div>
    );
};

// --- Main Page Component ---
const AdminRestaurantPage: React.FC = () => {
    const [sections, setSections] = useState<RestaurantSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        try {
            const savedContentRaw = localStorage.getItem(RESTAURANT_PAGE_KEY);
            if (savedContentRaw) {
                 let savedContent = JSON.parse(savedContentRaw);
                if (savedContent && !Array.isArray(savedContent)) { // Migration from old format
                    const migrated: RestaurantSection[] = [
                        { id: 'concept-migrated', type: 'concept', title: 'Notre concept', paragraphs: ([{id: 'p1', text: savedContent.conceptParagraph1 || ''}, {id: 'p2', text: savedContent.conceptParagraph2 || ''}]).filter(p => p.text) as ConceptParagraph[] },
                        // FIX: Explicitly map properties to avoid including incompatible 'icon' property from old data structure.
                        { id: 'values-migrated', type: 'values', title: 'Nos valeurs fondamentales', cards: (savedContent.values || []).map((v:any, i:number) => ({id: `v-migrated-${i}`, title: v.title, description: v.description}))}
                    ];
                    savedContent = migrated;
                }
                setSections(savedContent);
            } else {
                setSections([
                    { id: 'default-concept', type: 'concept', title: 'Notre concept', paragraphs: [{ id: 'p1', text: "Chez Agria Rouen, nous croyons...", imagePosition: 'left' }] },
                    // FIX: Explicitly map properties to create valid RestaurantValueCard objects, excluding the 'icon' property.
                    { id: 'default-values', type: 'values', title: 'Nos valeurs', cards: VALUES_DATA.map((v, i) => ({ id: `v-${i}`, title: v.title, description: v.description})) }
                ]);
            }
        } catch(e) { console.error(e); } finally { setIsLoading(false); }
    }, []);

    const handleSave = () => {
        localStorage.setItem(RESTAURANT_PAGE_KEY, JSON.stringify(sections));
        addToast("Page 'Mon Restaurant' sauvegardée avec succès !", 'success');
        setEditingSectionIndex(null);
    };

    const addSection = (type: RestaurantSection['type']) => {
        const id = `${type}-${Date.now()}`;
        const baseSection = { id, title: `Nouvelle section ${type}` };
        
        // FIX: Create a correctly typed newSection object based on the section type,
        // then add it to the state to avoid TypeScript inference issues.
        let newSection: RestaurantSection;

        switch (type) {
            case 'concept':
                newSection = { ...baseSection, type: 'concept', paragraphs: [] };
                break;
            case 'values':
                newSection = { ...baseSection, type: 'values', cards: [] };
                break;
            case 'image':
                newSection = { ...baseSection, type: 'image', imageUrl: '', caption: '' };
                break;
            case 'video':
                newSection = { ...baseSection, type: 'video', videoUrl: '', caption: '' };
                break;
            default:
                // This exhaustive check ensures all cases are handled.
                const _exhaustiveCheck: never = type;
                throw new Error(`Invalid section type: ${_exhaustiveCheck}`);
        }

        setSections(s => [...s, newSection]);
        setEditingSectionIndex(sections.length);
    };

    const deleteSection = (index: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette section ?")) {
            setSections(s => s.filter((_, i) => i !== index));
        }
    };
    
    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sections.length) return;
        const newSections = [...sections];
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        setSections(newSections);
    };
    
    const handleSectionUpdate = (index: number, updatedData: Partial<RestaurantSection>) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], ...updatedData };
        setSections(newSections);
    };

    const SECTION_EDITORS: { [key in RestaurantSection['type']]: React.FC<any> } = {
        concept: ConceptSectionEditor,
        values: ValuesSectionEditor,
        image: ImageSectionEditor,
        video: VideoSectionEditor,
    };
    
    const SECTION_ICONS: { [key in RestaurantSection['type']]: React.ReactNode } = {
        concept: <PencilIcon className="h-6 w-6" />,
        values: <ScaleIcon className="h-6 w-6" />,
        image: <ImageIcon className="h-6 w-6" />,
        video: <VideoIcon className="h-6 w-6" />,
    };

    const SectionCard: React.FC<{ section: RestaurantSection; index: number }> = ({ section, index }) => {
        const isEditing = editingSectionIndex === index;
        const EditorComponent = SECTION_EDITORS[section.type];
        return (
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-500">{SECTION_ICONS[section.type]}</span>
                        <h3 className="font-bold text-gray-800">{section.title || `Section ${section.type}`}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="btn-icon"><ArrowUpIcon /></button>
                        <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="btn-icon"><ArrowDownIcon /></button>
                        <button onClick={() => setEditingSectionIndex(isEditing ? null : index)} className="btn-secondary text-sm">{isEditing ? 'Fermer' : 'Modifier'}</button>
                        <button onClick={() => deleteSection(index)} className="btn-icon-danger"><TrashIcon /></button>
                    </div>
                </div>
                {isEditing && (
                    <div className="mt-4 pt-4 border-t">
                        <EditorComponent section={section} onUpdate={(data: Partial<RestaurantSection>) => handleSectionUpdate(index, data)} />
                    </div>
                )}
            </div>
        );
    };
    
    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-700">Gestion de la Page "Mon Restaurant"</h1>
                <button onClick={handleSave} className="btn-primary">Sauvegarder la Page</button>
            </div>
             {isLoading ? <p>Chargement...</p> : (
                <div className="space-y-4">
                    {sections.map((section, index) => <SectionCard key={section.id} section={section} index={index} />)}
                </div>
             )}
             <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold mb-2">Ajouter une section</h3>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => addSection('concept')} className="btn-secondary flex items-center gap-2"><PencilIcon/> Concept</button>
                    <button onClick={() => addSection('values')} className="btn-secondary flex items-center gap-2"><ScaleIcon/> Valeurs</button>
                    <button onClick={() => addSection('image')} className="btn-secondary flex items-center gap-2"><ImageIcon/> Image</button>
                    <button onClick={() => addSection('video')} className="btn-secondary flex items-center gap-2"><VideoIcon/> Vidéo</button>
                </div>
             </div>
              <style>{`
                .label-style { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #4B5563; }
                .input-style { display: block; width: 100%; padding: 0.5rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; }
                .btn-primary { padding: 0.5rem 1.5rem; background-color: #009A58; color: white; font-weight: bold; border-radius: 0.375rem; }
                .btn-secondary { padding: 0.5rem 1rem; background-color: #fff; border: 1px solid #D1D5DB; font-weight: 500; border-radius: 0.375rem; }
                .btn-icon { padding: 0.5rem; border-radius: 9999px; &:not(:disabled):hover { background-color: #F3F4F6; } &:disabled { opacity: 0.4; } }
                .btn-icon-danger { padding: 0.5rem; border-radius: 9999px; color: #DC2626; &:hover { background-color: #FEE2E2; } }
            `}</style>
        </div>
    );
};

export default AdminRestaurantPage;
