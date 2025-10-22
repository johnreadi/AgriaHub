
import React from 'react';

const CallToAction: React.FC = () => {
  return (
    <section className="relative py-32 text-white text-center bg-fixed" style={{ backgroundImage: "url('https://source.unsplash.com/random/1920/600/?fresh,vegetables,market,local')" }}>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative z-10 container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold max-w-3xl mx-auto leading-tight">
                Une cuisine faite maison avec des produits frais et de saison.
            </h2>
        </div>
    </section>
  );
};

export default CallToAction;