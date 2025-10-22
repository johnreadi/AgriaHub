import React, { useState, useEffect } from 'react';
import type { Slide, SliderSectionSettings } from '../../types';
import { PlusCircleIcon, ArrowUpIcon, ArrowDownIcon, VideoIcon, CodeIcon } from '../../components/icons/Icons';
import { useToast } from '../../components/ToastProvider';

const SLIDES_STORAGE_KEY = 'agria-slider-slides';
const SLIDER_SETTINGS_STORAGE_KEY = 'agria-slider-settings';

const DEFAULT_SECTION_SETTINGS: SliderSectionSettings = {
    titleText: 'Nos Services',
    titleColor: '#1f2937', // text-gray-800
    titleFont: "'Playfair Display', serif",
    titleSize: '2rem',
    subtitleText: 'Découvrez ce que nous pouvons vous offrir.',
    subtitleColor: '#6b7280', // text-gray-500
    subtitleFont: "'Montserrat', sans-serif",
    subtitleSize: '1rem',
};


const AdminSliderPage: React.FC = () => {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [editingSlide, setEditingSlide] = useState<Partial<Slide> | null>(null);
    const [sectionSettings, setSectionSettings] = useState<SliderSectionSettings>(DEFAULT_SECTION_SETTINGS);
    const { addToast } = useToast();

    useEffect(() => {
        try {
            const storedSlides = localStorage.getItem(SLIDES_STORAGE_KEY);
            if (storedSlides) {
                setSlides(JSON.parse(storedSlides));
            }
             const storedSettings = localStorage.getItem(SLIDER_SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                setSectionSettings(prev => ({...prev, ...JSON.parse(storedSettings)}));
            }
        } catch (e) { console.error(e); }
    }, []);
    
    const saveSlides = (newSlides: Slide[]) => {
        setSlides(newSlides);
        localStorage.setItem(SLIDES_STORAGE_KEY, JSON.stringify(newSlides));
    };

    const handleAddNew = () => {
        setEditingSlide({
            id: `slide-${Date.now()}`,
            type: 'image',
            source: '',
            title: 'Nouveau Titre',
            description: 'Description de la diapositive',
            titleColor: '#FFFFFF',
            descriptionColor: '#FFFFFF',
            titleFont: "'Playfair Display', serif",
            overlayColor: 'rgba(0, 0, 0, 0.4)',
        });
    };

    const handleSave = (slideData: Partial<Slide>) => {
        let newSlides;
        const existing = slides.find(s => s.id === slideData.id);
        if (existing) {
            newSlides = slides.map(s => s.id === slideData.id ? slideData as Slide : s);
        } else {
            newSlides = [...slides, slideData as Slide];
        }
        saveSlides(newSlides);
        setEditingSlide(null);
        addToast('Diapositive sauvegardée !', 'success');
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Supprimer cette diapositive ?")) {
            saveSlides(slides.filter(s => s.id !== id));
            addToast('Diapositive supprimée.', 'success');
        }
    };

    const moveSlide = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === slides.length - 1)) {
            return;
        }
        const newSlides = [...slides];
        const item = newSlides.splice(index, 1)[0];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        newSlides.splice(newIndex, 0, item);
        saveSlides(newSlides);
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSectionSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSettings = () => {
        localStorage.setItem(SLIDER_SETTINGS_STORAGE_KEY, JSON.stringify(sectionSettings));
        addToast('Paramètres de la section sauvegardés !', 'success');
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-700">Gestion du Slider</h1>
                <button onClick={handleAddNew} className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                    <PlusCircleIcon /> Ajouter une diapositive
                </button>
            </div>
            
            {editingSlide && <SlideForm slide={editingSlide} onSave={handleSave} onCancel={() => setEditingSlide(null)} />}
            
             <div className="mt-8 space-y-4">
                <h2 className="text-2xl font-bold text-gray-700 mb-2 border-t pt-6">Diapositives Actuelles</h2>
                {slides.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">Aucune diapositive. Ajoutez-en une pour commencer.</p>
                ) : (
                    slides.map((slide, index) => (
                        <div key={slide.id} className="bg-gray-50 p-4 rounded-lg border flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                    {slide.type === 'image' && <img src={slide.source} alt={slide.title} className="w-full h-full object-cover"/>}
                                    {slide.type === 'video' && <video src={slide.source} className="w-full h-full object-cover"/>}
                                    {slide.type === 'html' && <div className="w-full h-full flex items-center justify-center text-gray-500"><CodeIcon /></div>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{slide.title}</h3>
                                    <p className="text-sm text-gray-500 truncate max-w-sm">{slide.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => moveSlide(index, 'up')} disabled={index === 0} className="p-2 disabled:opacity-30"><ArrowUpIcon /></button>
                                <button onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1} className="p-2 disabled:opacity-30"><ArrowDownIcon /></button>
                                <button onClick={() => setEditingSlide(slide)} className="text-blue-600 hover:underline">Modifier</button>
                                <button onClick={() => handleDelete(slide.id)} className="text-red-600 hover:underline">Supprimer</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-700 mb-4 border-t pt-6">Paramètres de la section</h2>
                <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
                    {/* Title Settings */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Texte du titre</label>
                            <input type="text" name="titleText" value={sectionSettings.titleText} onChange={handleSettingsChange} className="input-style" />
                        </div>
                         <div>
                            <label className="label-style">Taille de police du titre</label>
                            <input type="text" name="titleSize" value={sectionSettings.titleSize} onChange={handleSettingsChange} className="input-style" placeholder="ex: 2rem" />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Couleur du titre</label>
                            <input type="color" name="titleColor" value={sectionSettings.titleColor} onChange={handleSettingsChange} className="input-color-style" />
                        </div>
                         <div>
                            <label className="label-style">Police du titre</label>
                             <select name="titleFont" value={sectionSettings.titleFont} onChange={handleSettingsChange} className="input-style">
                                <option value="'Playfair Display', serif">Playfair Display</option>
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="Arial, sans-serif">Arial</option>
                            </select>
                        </div>
                    </div>
                    {/* Subtitle Settings */}
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t mt-4">
                        <div>
                            <label className="label-style">Texte du sous-titre</label>
                            <input type="text" name="subtitleText" value={sectionSettings.subtitleText} onChange={handleSettingsChange} className="input-style" />
                        </div>
                         <div>
                            <label className="label-style">Taille de police du sous-titre</label>
                            <input type="text" name="subtitleSize" value={sectionSettings.subtitleSize} onChange={handleSettingsChange} className="input-style" placeholder="ex: 1rem" />
                        </div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label-style">Couleur du sous-titre</label>
                            <input type="color" name="subtitleColor" value={sectionSettings.subtitleColor} onChange={handleSettingsChange} className="input-color-style" />
                        </div>
                         <div>
                            <label className="label-style">Police du sous-titre</label>
                             <select name="subtitleFont" value={sectionSettings.subtitleFont} onChange={handleSettingsChange} className="input-style">
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="'Playfair Display', serif">Playfair Display</option>
                                <option value="Arial, sans-serif">Arial</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button onClick={handleSaveSettings} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Sauvegarder les paramètres
                </button>
            </div>
            <style>{`
                .label-style { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #4B5563; }
                .input-style { display: block; width: 100%; padding: 0.5rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; }
                .input-color-style { width: 100%; height: 2.5rem; padding: 0.25rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; }
            `}</style>
        </div>
    );
};

const SlideForm: React.FC<{ slide: Partial<Slide>, onSave: (slide: Partial<Slide>) => void, onCancel: () => void }> = ({ slide, onSave, onCancel }) => {
    const [formData, setFormData] = useState(slide);
    const { addToast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const sizeLimit = formData.type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
            if (file.size > sizeLimit) {
                addToast(`Fichier trop volumineux (max ${sizeLimit / 1024 / 1024}MB)`, 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, source: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">{slide.id?.startsWith('slide-') ? 'Nouvelle diapositive' : 'Modifier la diapositive'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label-style">Titre</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-style" />
                    </div>
                     <div>
                        <label className="label-style">Description</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="input-style" />
                    </div>
                </div>

                <div>
                    <label className="label-style">Type de contenu</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="input-style">
                        <option value="image">Image</option>
                        <option value="video">Vidéo</option>
                        <option value="html">HTML</option>
                    </select>
                </div>
                
                {formData.type === 'html' ? (
                    <div>
                        <label className="label-style">Contenu HTML</label>
                        <textarea name="source" value={formData.source} onChange={handleChange} rows={5} className="input-style font-mono"></textarea>
                    </div>
                ) : (
                    <div>
                        <label className="label-style">Source (URL ou charger un fichier)</label>
                        <input type="text" name="source" value={!formData.source?.startsWith('data:') ? formData.source : ''} onChange={handleChange} className="input-style" placeholder="https://... ou charger un fichier" />
                        <input type="file" onChange={handleFileChange} accept={formData.type === 'image' ? 'image/*' : 'video/*'} className="mt-2 text-sm" />
                    </div>
                )}
                
                <h3 className="text-lg font-semibold text-gray-600 pt-4 border-t">Personnalisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="label-style">Couleur du titre</label>
                        <input type="color" name="titleColor" value={formData.titleColor} onChange={handleChange} className="input-color-style" />
                    </div>
                    <div>
                        <label className="label-style">Couleur description</label>
                        <input type="color" name="descriptionColor" value={formData.descriptionColor} onChange={handleChange} className="input-color-style" />
                    </div>
                    <div>
                        <label className="label-style">Couleur de la superposition</label>
                        <input type="text" name="overlayColor" value={formData.overlayColor} onChange={handleChange} className="input-style" placeholder="rgba(0,0,0,0.4)" />
                    </div>
                    <div>
                        <label className="label-style">Police du titre</label>
                        <select name="titleFont" value={formData.titleFont} onChange={handleChange} className="input-style">
                             <option value="'Playfair Display', serif">Playfair Display</option>
                             <option value="'Montserrat', sans-serif">Montserrat</option>
                             <option value="Arial, sans-serif">Arial</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
                    <button type="submit" className="btn-primary">Sauvegarder</button>
                </div>
            </form>
             <style>{`
                .btn-primary { padding: 0.5rem 1.5rem; background-color: #009A58; color: white; font-weight: bold; border-radius: 0.375rem; }
                .btn-secondary { padding: 0.5rem 1.5rem; background-color: #E5E7EB; font-weight: bold; border-radius: 0.375rem; }
            `}</style>
        </div>
    );
};

export default AdminSliderPage;