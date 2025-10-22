import React, { useState, useEffect, useCallback } from 'react';
import type { Slide } from '../types';
import apiService from '../src/services/api';

const AUTOPLAY_INTERVAL = 5000; // 5 seconds

const DEFAULT_SLIDES: Slide[] = [
    {
        id: 'default-1',
        title: 'Bienvenue chez AGRIA ROUEN',
        description: 'Découvrez nos spécialités culinaires dans un cadre chaleureux',
        type: 'image',
        source: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        overlayColor: 'rgba(0, 0, 0, 0.4)',
        titleColor: '#ffffff',
        titleFont: 'Playfair Display, serif',
        descriptionColor: '#f3f4f6'
    },
    {
        id: 'default-2',
        title: 'Cuisine Authentique',
        description: 'Des plats préparés avec passion et des ingrédients frais',
        type: 'image',
        source: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        overlayColor: 'rgba(0, 154, 88, 0.3)',
        titleColor: '#ffffff',
        titleFont: 'Playfair Display, serif',
        descriptionColor: '#f3f4f6'
    }
];
const ServicesSlider: React.FC = () => {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const response = await apiService.listSlides({ isActive: 'true' });
                // Normaliser la réponse: Node (data) ou PHP (items), ou tableau direct
                const rawList = (response && (response as any).data)
                    ? (response as any).data
                    : (response && (response as any).items)
                        ? (response as any).items
                        : Array.isArray(response)
                            ? (response as any)
                            : [];

                const items: Slide[] = (rawList as any[])
                    .filter((s: any) => (s?.isActive ?? s?.is_active) !== false)
                    .map((s: any) => ({
                        id: String(s?.id ?? s?.slide_id ?? ''),
                        title: s?.title ?? s?.titre ?? '',
                        description: s?.description ?? s?.desc ?? '',
                        type: s?.type ?? s?.media_type ?? 'image',
                        source: s?.source ?? s?.url ?? s?.src ?? '',
                        overlayColor: s?.overlayColor ?? s?.overlay_color ?? 'rgba(0,0,0,0.3)',
                        titleColor: s?.titleColor ?? s?.title_color ?? '#ffffff',
                        titleFont: s?.titleFont ?? s?.title_font ?? 'Playfair Display, serif',
                        descriptionColor: s?.descriptionColor ?? s?.description_color ?? '#f3f4f6',
                    }));
                setSlides(items.length > 0 ? items : DEFAULT_SLIDES);
            } catch (e) {
                console.error('Failed to fetch slides from API', e);
                setSlides(DEFAULT_SLIDES);
            }
        };
        fetchSlides();
    }, []);


const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === slides.length - 1 ? 0 : prevIndex + 1));
}, [slides.length]);

const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? slides.length - 1 : prevIndex - 1));
};

const goToSlide = (index: number) => {
    setCurrentIndex(index);
};

useEffect(() => {
    if (slides.length > 1) {
        const timer = setTimeout(goToNext, AUTOPLAY_INTERVAL);
        return () => clearTimeout(timer);
    }
}, [currentIndex, slides.length, goToNext]);

if (slides.length === 0) {
    return (
        <div className="relative w-full aspect-video md:aspect-[2.5/1] overflow-hidden rounded-lg shadow-2xl bg-gray-100">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500">Aucune diapositive disponible</div>
            </div>
        </div>
    );
}

    return (
        <div className="relative w-full aspect-video md:aspect-[2.5/1] overflow-hidden rounded-lg shadow-2xl group bg-white border-2 border-gray-200">
            <div className="relative h-full w-full">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className="absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out"
                        style={{ opacity: index === currentIndex ? 1 : 0, zIndex: index === currentIndex ? 10 : 1 }}
                    >
                        {/* Background Media */}
                        {slide.type === 'image' && <img src={slide.source} alt={slide.title} className="w-full h-full object-cover" />}
                        {slide.type === 'video' && <video src={slide.source} className="w-full h-full object-cover" autoPlay loop muted playsInline />}
                        {slide.type === 'html' && <div className="w-full h-full bg-gray-100" dangerouslySetInnerHTML={{ __html: slide.source }}></div>}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0" style={{ backgroundColor: slide.overlayColor }}></div>

                        {/* Text Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-white">
                            <h3 
                                className="text-3xl md:text-5xl font-bold mb-4 animate-slide-in-up" 
                                style={{ color: slide.titleColor, fontFamily: slide.titleFont }}
                            >
                                {slide.title}
                            </h3>
                            <p 
                                className="text-lg md:text-xl max-w-2xl animate-slide-in-up animation-delay-300" 
                                style={{ color: slide.descriptionColor }}
                            >
                                {slide.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button onClick={goToPrev} className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        &#10094;
                    </button>
                    <button onClick={goToNext} className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        &#10095;
                    </button>
                </>
            )}

            {/* Navigation Dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {slides.map((slide, index) => (
                        <button
                            key={slide.id || `dot-${index}`}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white'}`}
                        ></button>
                    ))}
                </div>
            )}
            
            <style>{`
                @keyframes slide-in-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-in-up {
                    animation: slide-in-up 0.8s ease-out both;
                }
                .animation-delay-300 {
                    animation-delay: 0.3s;
                }
            `}</style>
        </div>
    );
};

export default ServicesSlider;