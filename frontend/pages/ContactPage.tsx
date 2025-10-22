


import React, { useState, useEffect } from 'react';
import type { Conversation } from '../types';
import { MESSAGES_STORAGE_KEY, MOCK_CONVERSATIONS } from '../constants';

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

const ContactPage: React.FC = () => {
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
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    // Save to messaging system
    try {
        const existingConversationsRaw = localStorage.getItem(MESSAGES_STORAGE_KEY);
        let allConversations: Conversation[] = [];

        // Initialize with mock data if it's the first time
        if (existingConversationsRaw) {
            allConversations = JSON.parse(existingConversationsRaw);
        } else {
            allConversations = MOCK_CONVERSATIONS;
        }

        const newConversation: Conversation = {
            id: `conv-${Date.now()}`,
            userId: Date.now(), // Mock user ID
            userName: name,
            userEmail: email,
            subject: 'Nouveau message de contact',
            isRead: false,
            lastMessageTimestamp: new Date().toISOString(),
            messages: [{
                id: `msg-${Date.now()}`,
                sender: 'user',
                text: `De: ${name} (${email})\n\n${message}`,
                timestamp: new Date().toISOString()
            }]
        };
        
        allConversations.unshift(newConversation); // Add to the beginning of the list
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(allConversations));
        
        alert("Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.");
        form.reset();

    } catch (error) {
        console.error("Failed to save message:", error);
        alert("Désolé, une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer.");
    }
  };
  
    const openingHoursParts = settings.openingHours.split(' : ');
    const openingDays = openingHoursParts[0] || '';
    const openingTimes = openingHoursParts.slice(1).join(' : ');

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Nous contacter</h1>
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-2xl font-bold text-agria-green-dark mb-4">Nos coordonnées</h3>
                <div className="space-y-4 text-gray-700">
                  <p><strong>Adresse :</strong> {settings.address}</p>
                  <p><strong>Téléphone :</strong> <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="text-agria-green hover:underline">{settings.phone}</a></p>
                  <p><strong>Email :</strong> <a href={`mailto:${settings.email}`} className="text-agria-green hover:underline">{settings.email}</a></p>
                </div>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-2xl font-bold text-agria-green-dark mb-4">Horaires d'ouverture</h3>
                <div className="space-y-2 text-gray-700">
                    <p><strong>{openingDays}</strong> : {openingTimes}</p>
                    <p><strong>Samedi - Dimanche :</strong> Fermé</p>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-2xl font-bold text-agria-green-dark mb-4">Envoyez-nous un message</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom complet</label>
              <input type="text" id="name" name="name" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-agria-green focus:border-agria-green"/>
            </div>
             <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse e-mail</label>
              <input type="email" id="email" name="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-agria-green focus:border-agria-green"/>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
              <textarea id="message" name="message" rows={4} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-agria-green focus:border-agria-green"></textarea>
            </div>
            <div>
              <button type="submit" className="w-full bg-agria-green hover:bg-agria-green-dark text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-sm">
                Envoyer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;