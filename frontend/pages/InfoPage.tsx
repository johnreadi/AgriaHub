


import React, { useState, useEffect } from 'react';
import { PhoneIcon, RestaurantIcon } from '../components/icons/Icons';
import InteractiveMap from '../components/InteractiveMap';

const SETTINGS_KEY = 'agria-app-settings';
const ROUEN_COORDS: [number, number] = [49.4346, 1.0895];

interface Settings {
    address: string;
    phone: string;
    openingHours: string;
}
const DEFAULT_SETTINGS: Settings = {
    address: '2 Rue Saint-Sever, 76100 Rouen',
    phone: '02 32 18 97 80',
    openingHours: 'Lundi - Vendredi : 11h20 - 13h30'
};

const InfoPage: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        // Load general settings
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) setSettings(JSON.parse(savedSettings));
        } catch (e) { console.error(e); }
    }, []);

    const openingHoursParts = settings.openingHours.split(' : ');
    const openingDays = openingHoursParts[0] || '';
    const openingTimes = openingHoursParts.slice(1).join(' : ');

    return (
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Informations Utiles</h1>
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-agria-green-dark mb-4">Adresse & Accès</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="text-gray-700">
                            <p className="font-semibold">AGRIA ROUEN</p>
                            <p>{settings.address}</p>
                            <h3 className="font-bold mt-4 mb-2">Transports en commun :</h3>
                            <ul className="list-disc list-inside">
                                {/* This should be managed in AdminInfoPage now */}
                                <li>Bus T4 - Arrêt "Martainville"</li>
                                <li>Métro - Station "Joffre-Mutualité" (10 min à pied)</li>
                            </ul>
                        </div>
                        <div className="h-64 md:h-full w-full rounded-lg shadow-md overflow-hidden">
                           <InteractiveMap position={ROUEN_COORDS} address={settings.address} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-agria-green-dark mb-4">Horaires d'ouverture</h2>
                    <div className="flex items-start gap-4">
                        <RestaurantIcon className="h-8 w-8 text-agria-green mt-1"/>
                        <div>
                            <p className="text-gray-700 font-semibold">Service du midi :</p>
                            <p className="text-gray-600"><strong>{openingDays}</strong> : {openingTimes}</p>
                            <p className="text-gray-600"><strong>Samedi & Dimanche :</strong> Fermé</p>
                        </div>
                    </div>
                </div>
                
                 <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-agria-green-dark mb-4">Contact Rapide</h2>
                    <div className="flex items-start gap-4">
                        <PhoneIcon className="h-8 w-8 text-agria-green mt-1"/>
                        <div>
                            <p className="text-gray-700 font-semibold">Une question ?</p>
                            <p className="text-gray-600">N'hésitez pas à nous appeler pendant les heures de service.</p>
                            <p className="text-gray-600 font-bold"><a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="text-agria-green hover:underline">{settings.phone}</a></p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InfoPage;