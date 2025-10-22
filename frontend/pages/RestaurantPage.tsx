import React, { useState, useEffect } from 'react';
import { VALUES_DATA } from '../constants';
import type { RestaurantSection, RestaurantValueCard, ConceptSectionData, ValuesSectionData, ImageSectionData, VideoSectionData, ConceptParagraph } from '../types';

const RESTAURANT_PAGE_KEY = 'agria-restaurant-page-content';

const RestaurantPage: React.FC = () => {
    const [sections, setSections] = useState<RestaurantSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const savedContentRaw = localStorage.getItem(RESTAURANT_PAGE_KEY);
            if (savedContentRaw) {
                let savedContent = JSON.parse(savedContentRaw);

                // --- MIGRATION LOGIC ---
                // 1. Migrate from old object format to new array format
                if (savedContent && !Array.isArray(savedContent) && savedContent.conceptParagraph1) {
                    const migratedSections: RestaurantSection[] = [
                        {
                            id: 'migrated-concept',
                            type: 'concept',
                            title: 'Notre concept',
                            // FIX: Cast the array to ConceptParagraph[] to ensure correct type inference for imagePosition.
                            paragraphs: ([
                                { id: 'p1', text: savedContent.conceptParagraph1 || '', imagePosition: 'left' },
                                { id: 'p2', text: savedContent.conceptParagraph2 || '', imagePosition: 'left' }
                            ] as ConceptParagraph[]).filter(p => p.text)
                        },
                        {
                            id: 'migrated-values',
                            type: 'values',
                            title: 'Nos valeurs fondamentales',
                            cards: (savedContent.values || []).map((v: any, i: number) => ({
                                id: `v-migrated-${i}`,
                                title: v.title,
                                description: v.description
                            }))
                        }
                    ];
                    savedContent = migratedSections;
                    localStorage.setItem(RESTAURANT_PAGE_KEY, JSON.stringify(migratedSections));
                }

                // 2. Migrate concept paragraphs from string[] to object[] if needed
                if (Array.isArray(savedContent)) {
                    const migratedSections = savedContent.map((section: any) => {
                        if (section.type === 'concept' && section.paragraphs && section.paragraphs.length > 0 && typeof section.paragraphs[0] === 'string') {
                            return {
                                ...section,
                                paragraphs: section.paragraphs.map((p: string, i: number) => ({
                                    id: `p-migrated-${section.id}-${i}`,
                                    text: p,
                                    imagePosition: 'left'
                                }))
                            };
                        }
                        return section;
                    });
                     setSections(migratedSections);
                }

            } else {
                // Default content if nothing is saved
                setSections([
                    {
                        id: 'default-concept', type: 'concept', title: 'Notre concept',
                        paragraphs: [
                            { id: 'p1', text: "Chez Agria Rouen, nous croyons en une cuisine simple, généreuse et responsable. Chaque jour, notre équipe s'engage à vous proposer des plats issus de partenariats privilégiés avec des producteurs locaux tout en respectant la loi EGALIM.", imagePosition: 'left' },
                            { id: 'p2', text: "Notre mission est de vous offrir bien plus qu'un simple repas : une véritable pause déjeuner gourmande et équilibrée, servie dans une ambiance conviviale et chaleureuse. Nous sommes fiers de contribuer au bien-être de nos convives en proposant une alimentation saine et savoureuse au quotidien.", imagePosition: 'left' }
                        ]
                    },
                    {
                        id: 'default-values', type: 'values', title: 'Nos valeurs fondamentales',
                        cards: VALUES_DATA.map((v, i) => ({ id: `v-${i}`, title: v.title, description: v.description }))
                    }
                ]);
            }
        } catch (e) {
            console.error("Failed to load restaurant page content", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const renderSection = (section: RestaurantSection) => {
        switch (section.type) {
            case 'concept':
                return (
                    <div key={section.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-2xl font-bold text-agria-green-dark mb-4">{section.title}</h2>
                        <div className="space-y-8">
                            {section.paragraphs.map(p => {
                                if (p.image) {
                                    return (
                                        <div key={p.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                            <div className={`overflow-hidden rounded-lg shadow-lg ${p.imagePosition === 'right' ? 'md:order-last' : ''}`}>
                                                <img src={p.image} alt="Illustration du concept" className="w-full h-auto object-cover" />
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{p.text}</p>
                                        </div>
                                    );
                                } else {
                                    return <p key={p.id} className="text-gray-700 leading-relaxed">{p.text}</p>;
                                }
                            })}
                        </div>
                    </div>
                );
            case 'values':
                return (
                    <div key={section.id}>
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">{section.title}</h2>
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {section.cards.map((card, index) => {
                                const originalValueData = VALUES_DATA.find(v => v.title === card.title);
                                const icon = originalValueData ? originalValueData.icon : null;
                                return (
                                    <div key={card.id} className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                                        {card.image && <img src={card.image} alt={card.title} className="w-full h-48 object-cover"/>}
                                        <div className="p-6">
                                            {!card.image && icon && (
                                                <div className="bg-agria-green text-white rounded-full p-4 mb-4 inline-block">
                                                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-8 w-8' }) : icon}
                                                </div>
                                            )}
                                            <h3 className="text-xl font-bold mb-2 text-gray-800">{card.title}</h3>
                                            <p className="text-gray-600 leading-relaxed">{card.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'image':
                 return (
                    <div key={section.id} className="my-8 text-center">
                        <figure>
                            <img src={section.imageUrl} alt={section.caption || section.title} className="max-w-full mx-auto rounded-lg shadow-lg"/>
                            {section.caption && <figcaption className="mt-2 text-sm text-gray-500 italic">{section.caption}</figcaption>}
                        </figure>
                    </div>
                );
            case 'video':
                 return (
                    <div key={section.id} className="my-8 text-center">
                         <figure>
                            <div className="aspect-w-16 aspect-h-9 rounded-lg shadow-lg overflow-hidden">
                                <iframe src={section.videoUrl.replace("watch?v=", "embed/")} title={section.caption || section.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            </div>
                             {section.caption && <figcaption className="mt-2 text-sm text-gray-500 italic">{section.caption}</figcaption>}
                        </figure>
                    </div>
                 );
            default:
                return null;
        }
    };

    if (isLoading) {
        return <div>Chargement...</div>;
    }

    return (
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Mon Restaurant</h1>
            <div className="space-y-10">
                {sections.length > 0 ? sections.map(renderSection) : <p>Le contenu de cette page n'a pas encore été défini.</p>}
            </div>
        </div>
    );
};

export default RestaurantPage;
