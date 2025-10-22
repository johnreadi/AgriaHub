

import React from 'react';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative h-[calc(100vh-68px)] min-h-[500px] flex items-center justify-center text-white text-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://source.unsplash.com/random/1920x1080/?modern,restaurant,interior,bright')" }}></div>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-10 px-4">
        <p className="text-sm md:text-base tracking-[0.3em] uppercase mb-4">Restaurant Administratif Inter-Entreprises</p>
        <h1 className="text-5xl md:text-7xl font-bold font-serif mb-6">AGRIA ROUEN</h1>
        <p className="max-w-2xl mx-auto mb-8 text-gray-200">
          Découvrez une cuisine authentique et savoureuse, préparée avec passion par nos chefs à partir de produits frais et locaux.
        </p>
        <a href="#menu" className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-3 px-8 rounded-full uppercase tracking-widest text-sm transition-transform transform hover:scale-105 duration-300 shadow-lg">
          Voir le menu
        </a>
      </div>
    </section>
  );
};

export default Hero;