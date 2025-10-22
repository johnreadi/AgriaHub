

import React from 'react';
import { VALUES_DATA } from '../constants';

const Values: React.FC = () => {
  return (
    <section id="values" className="py-20 lg:py-32 bg-gray-50">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl lg:text-5xl font-serif font-bold text-gray-800 mb-16">Nos valeurs</h2>
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {VALUES_DATA.map((value) => (
            <div key={value.title} className="flex flex-col items-center">
              <div className="bg-agria-green text-white rounded-full p-5 mb-6 inline-block transform hover:scale-110 transition-transform duration-300 shadow-md">
                {value.icon}
              </div>
              <h3 className="text-2xl font-serif font-bold mb-3">{value.title}</h3>
              <p className="text-gray-600 leading-relaxed max-w-xs">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Values;