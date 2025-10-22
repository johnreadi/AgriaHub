
import React, { useState, useEffect } from 'react';
import { ImageIcon } from '../components/icons/Icons';

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
    mainBackgroundValue: "https://source.unsplash.com/random/1200x400/?catering,food,event",
    cards: [
        { title: "Pauses-café", description: "Viennoiseries, boissons chaudes et jus de fruits pour bien démarrer la journée.", image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAEgAyADASIAAhEBAxEB/8QAGwABAQACAwEAAAAAAAAAAAAAAAEGBwIDBAX/xABBEAABAwIFAgMGBAMIAQQDAAABAAIDBBEFEgYhMUETIlFhcYEHFDJCkaGxIzNSYnLR4UKC8BVSFxgkNGOCstLi/8QAGAEBAQEBAQAAAAAAAAAAAAAAAAECAwT/xAAhEQEBAAICAgMBAQEAAAAAAAAAAQIRITEDEkFRIgNCYf/aAAwDAQACEQMRAD8A9UoiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAibGFw/2wA=" },
        { title: "Moments de convivialité", description: "Un assortiment de pièces salées et sucrées pour des moments conviviaux.", image: "https://source.unsplash.com/random/400x300/?cocktail,buffet" }
    ],
    ctaHeading: "Un projet ? Une question ?",
    ctaParagraph: "Contactez-nous pour discuter de vos besoins et obtenir un devis personnalisé."
};


const TraiteurPage: React.FC = () => {
  const [content, setContent] = useState<TraiteurPageContent>(DEFAULT_TRAITEUR_CONTENT);

  useEffect(() => {
    try {
        const savedContent = localStorage.getItem(TRAITEUR_PAGE_KEY);
        if(savedContent) {
            setContent(JSON.parse(savedContent));
        }
    } catch (e) {
        console.error("Failed to load traiteur content", e);
    }
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
        e.preventDefault();
        window.location.hash = href;
    }
  };

  const renderMainBackground = () => {
    switch (content.mainBackgroundType) {
        case 'color':
            return (
                <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: content.mainBackgroundValue }}></div>
            );
        case 'image':
            return (
                <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${content.mainBackgroundValue})` }}></div>
            );
        case 'video':
            return (
                <video 
                    key={content.mainBackgroundValue} // key to force re-render on src change
                    src={content.mainBackgroundValue} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                />
            );
        default:
            return (
                 <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${DEFAULT_TRAITEUR_CONTENT.mainBackgroundValue})` }}></div>
            );
    }
  };

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Service Traiteur</h1>
      <div className="relative rounded-lg shadow-xl overflow-hidden mb-8 h-64">
        {renderMainBackground()}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <h2 className="text-4xl font-bold text-white text-center px-4">{content.mainHeading}</h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
            {content.mainParagraph}
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 my-8 max-w-4xl mx-auto">
            {content.cards.map((card, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
                    {card.image ? (
                        <img src={card.image} alt={card.title} className="w-full h-48 object-cover" />
                    ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                    )}
                    <div className="p-6 text-center flex-grow flex flex-col">
                        <h3 className="font-bold text-agria-green-dark text-xl">{card.title}</h3>
                        <p className="text-gray-600 mt-2 flex-grow">{card.description}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-8 text-center bg-agria-green bg-opacity-10 p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-agria-green-dark mb-2">{content.ctaHeading}</h3>
            <p className="text-gray-700 mb-4">{content.ctaParagraph}</p>
            <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="bg-agria-green hover:bg-agria-green-dark text-white font-semibold py-2 px-6 rounded-md transition-colors shadow-sm">
                Demander un devis
            </a>
        </div>
      </div>
    </div>
  );
};

export default TraiteurPage;