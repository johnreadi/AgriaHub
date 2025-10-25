

import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-20 lg:py-32 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="overflow-hidden rounded-lg shadow-2xl">
            <img src="https://source.unsplash.com/random/600/700/?chef,plating,gourmet,food" alt="Plat du restaurant" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
          </div>
          <div>
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-gray-800 mb-6">Le restaurant</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Chez Agria Rouen, nous croyons en une cuisine simple, généreuse et responsable. Chaque jour, notre équipe s'engage à vous proposer des plats faits maison, élaborés à partir de produits frais, de saison et issus de partenariats avec des producteurs locaux.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Notre mission est de vous offrir une pause déjeuner gourmande et équilibrée dans une ambiance conviviale et chaleureuse.
            </p>
            <a href="#contact" className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-3 px-8 rounded-full uppercase tracking-widest text-sm transition-all duration-300">
              En savoir plus
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;