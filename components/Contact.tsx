

import React, { useState, useEffect } from 'react';

const SETTINGS_KEY = 'agria-app-settings';

interface Settings {
    address: string;
    phone: string;
    email: string;
    openingHours: string;
}

const DEFAULT_SETTINGS: Settings = {
    address: '2 Rue Saint-Sever, 76100 Rouen',
    phone: '02 32 18 97 80',
    email: 'secretariatagria@free.fr',
    openingHours: 'Lundi - Vendredi : 11h20 - 13h30'
};


const Contact: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsedSettings }));
            }
        } catch (e) {
            console.error("Failed to load settings from localStorage", e);
        }
    }, []);
    
    const openingHoursParts = settings.openingHours.split(' : ');
    const openingDays = openingHoursParts[0] || '';
    const openingTimes = openingHoursParts.slice(1).join(' : ');

  return (
    <section id="contact" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl lg:text-5xl font-serif font-bold text-gray-800 mb-16 text-center">Contact</h2>
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="bg-gray-50 p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-serif font-bold mb-6">Nos coordonnées</h3>
            <div className="space-y-4 text-gray-600">
              <p><strong>Adresse :</strong> {settings.address}</p>
              <p><strong>Téléphone :</strong> <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="text-agria-green hover:underline">{settings.phone}</a></p>
              <p><strong>Email :</strong> <a href={`mailto:${settings.email}`} className="text-agria-green hover:underline">{settings.email}</a></p>
            </div>

            <h3 className="text-2xl font-serif font-bold mt-10 mb-6">Horaires d'ouverture</h3>
            <div className="space-y-2 text-gray-600">
                <p><strong>{openingDays}</strong> : {openingTimes}</p>
                <p><strong>Samedi - Dimanche :</strong> Fermé</p>
            </div>
          </div>
          <div className="h-96 lg:h-full w-full rounded-lg shadow-2xl overflow-hidden">
             <img src="https://source.unsplash.com/random/800/600/?rouen,france,street,map" alt="Carte de localisation du restaurant" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;