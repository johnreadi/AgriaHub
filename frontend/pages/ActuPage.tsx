import React, { useState, useEffect } from 'react';
import type { ActuItem } from '../types';
import { INITIAL_ACTU_DATA } from '../constants';

const ACTU_STORAGE_KEY = 'agria-actu';

const ActuPage: React.FC = () => {
  const [actuItems, setActuItems] = useState<ActuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedActu = localStorage.getItem(ACTU_STORAGE_KEY);
      if (savedActu) {
        setActuItems(JSON.parse(savedActu));
      } else {
        // If no news in storage, load initial data
        setActuItems(INITIAL_ACTU_DATA);
        localStorage.setItem(ACTU_STORAGE_KEY, JSON.stringify(INITIAL_ACTU_DATA));
      }
    } catch (error) {
      console.error("Failed to load news from localStorage", error);
      setActuItems(INITIAL_ACTU_DATA);
    } finally {
      setIsLoading(false);
    }
  }, []);


  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">L'actu de l'AGRIA</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLoading ? (
          <p>Chargement des actualités...</p>
        ) : actuItems.length > 0 ? (
          <div className="space-y-4">
            {actuItems.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-lg text-agria-green-dark">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.date}</p>
                <p className="mt-2 text-gray-700">{item.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Aucune actualité pour le moment.</p>
        )}
      </div>
    </div>
  );
};

export default ActuPage;