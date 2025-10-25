

import React, { useState, useEffect } from 'react';
import type { DayOfWeek, WeeklyMenu, MenuCategory, MenuItem } from '../types';
import { PlateIcon, SpinnerIcon, ImageIcon, DownloadIcon } from './icons/Icons';
import ImageModal from './ImageModal';
import apiService from '../src/services/api';

const MENU_STORAGE_KEY = 'weeklyMenu'; // Désactivé: on ne conserve plus de cache local pour le menu

// Déclaration pour informer TypeScript de l'existence de jspdf dans la portée globale
declare const jspdf: any;

const Menu: React.FC = () => {
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [today, setToday] = useState<DayOfWeek | null>(null);
  const days: DayOfWeek[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
  const [selectedImage, setSelectedImage] = useState<{src: string, alt: string} | null>(null);

  useEffect(() => {
    const dayIndex = new Date().getDay(); // 0:Sun, 1:Mon, ..., 6:Sat
    const daysMap: { [key: number]: DayOfWeek } = {
        1: 'LUNDI',
        2: 'MARDI',
        3: 'MERCREDI',
        4: 'JEUDI',
        5: 'VENDREDI',
    };
    setToday(daysMap[dayIndex] || null); // Sets to null for Sat (6) and Sun (0)
  }, []);

  useEffect(() => {
    const loadMenu = async () => {
      setIsLoading(true);
      try {
        // Essayer de récupérer le menu depuis l'API
        const menuData = await apiService.getMenu();
        if (menuData && typeof menuData === 'object') {
          // Assurer que tous les items ont un ID pour la compatibilité
          Object.values(menuData).forEach((dayCategories: any) => {
              // Vérifier que dayCategories est un tableau avant d'utiliser forEach
              if (Array.isArray(dayCategories)) {
                  dayCategories.forEach((category: MenuCategory) => {
                      if (category && category.items && Array.isArray(category.items)) {
                          category.items.forEach((item) => {
                              if (!item.id) {
                                  item.id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                              }
                          });
                      }
                  });
              }
          });
          setWeeklyMenu(menuData);
        } else {
          // Ne plus utiliser localStorage: afficher un état vide si pas de données
          setWeeklyMenu(null);
        }
      } catch (e) {
        console.error("Erreur lors du chargement du menu depuis l'API:", e);
        // Ne plus faire de fallback localStorage
        setWeeklyMenu(null);
      } finally {
        // Add a small delay to prevent flickering
        setTimeout(() => setIsLoading(false), 200);
      }
    };

    loadMenu();
  }, []);

  const handleDownloadPdf = async () => {
      if (!weeklyMenu) return;

      setIsPrinting(true);
      try {
          const { jsPDF } = jspdf;
          const doc = new jsPDF('p', 'mm', 'a4');
          const pageHeight = doc.internal.pageSize.getHeight();
          const pageWidth = doc.internal.pageSize.getWidth();
          const margin = 15;
          let y = margin + 10;

          const checkPageBreak = (neededHeight: number) => {
              if (y + neededHeight > pageHeight - margin) {
                  doc.addPage();
                  y = margin;
              }
          };

          doc.setFont('times', 'bold');
          doc.setFontSize(24);
          doc.text('Menu de la Semaine', pageWidth / 2, y, { align: 'center' });
          y += 15;

          for (const day of days) {
              if (!weeklyMenu[day] || weeklyMenu[day].length === 0) continue;
              checkPageBreak(20);

              doc.setFont('helvetica', 'bold');
              doc.setFontSize(18);
              doc.setTextColor('#009A58');
              doc.text(day, margin, y);
              y += 10;
              doc.setTextColor(0, 0, 0);

              const categories = weeklyMenu[day];
              for (const category of categories) {
                  if (category.items.length === 0) continue;
                  checkPageBreak(10);
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(12);
                  doc.text(category.title, margin + 5, y);
                  y += 6;
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(10);
                  for (const item of category.items) {
                      const lines = doc.splitTextToSize(item.name, pageWidth - (margin * 2) - 15);
                      const neededHeight = lines.length * 5;
                      checkPageBreak(neededHeight);
                      doc.text(lines, margin + 10, y);
                      y += neededHeight;
                  }
                  y += 4;
              }
              y += 5;
          }
          
          doc.save('menu-de-la-semaine.pdf');

      } catch (err) {
          console.error("Erreur lors de la génération du PDF:", err);
      } finally {
          setIsPrinting(false);
      }
  };

  const activeMenu = weeklyMenu && today ? weeklyMenu[today] : [];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <SpinnerIcon size="large" className="text-agria-green" />
        </div>
      );
    }

    if (!today) {
      return (
        <div className="text-center bg-gray-100 p-8 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">Le restaurant est fermé aujourd'hui.</h3>
          <p className="text-gray-500 mt-2">Le menu du jour sera disponible Lundi. Bon week-end !</p>
        </div>
      );
    }

    if (!weeklyMenu) {
      return (
        <div className="text-center bg-gray-100 p-8 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">Aucun menu disponible</h3>
          <p className="text-gray-500 mt-2">Le menu de la semaine sera bientôt publié. Revenez plus tard !</p>
        </div>
      );
    }
    
    if (!activeMenu || activeMenu.length === 0) {
        return <p className="col-span-full text-center text-gray-500">Le menu pour aujourd'hui n'est pas encore disponible.</p>;
    }
    
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left animate-fade-in">
        {activeMenu.map((category: MenuCategory) => (
          <div key={category.title} className="p-6 bg-white border border-gray-200/80 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-xl font-bold text-agria-green-dark mb-4 flex items-center gap-3">
              <PlateIcon />
              {category.title}
            </h3>
            <ul>
              {category.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-200 last:border-b-0">
                  {item.image ? (
                    <button onClick={() => setSelectedImage({src: item.image as string, alt: item.name})} className="focus:outline-none ring-offset-2 focus:ring-2 focus:ring-agria-green rounded-md">
                        <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-md flex-shrink-0 shadow-sm cursor-zoom-in transform hover:scale-105 transition-transform" />
                    </button>
                  ) : (
                     <div className="w-14 h-14 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400">
                        <ImageIcon className="h-7 w-7" />
                    </div>
                  )}
                  <span className="text-gray-700">{item.name}</span>
                </li>
              ))}
               {category.items.length === 0 && <li className="text-sm text-gray-500 italic mt-2">Aucun plat pour cette catégorie.</li>}
            </ul>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div id="menu">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
             <div className="text-left mb-4 sm:mb-0">
                <h2 className="text-4xl lg:text-5xl font-bold font-serif text-gray-800">Menu du Jour</h2>
                <p className="text-lg text-gray-500 mt-1">{today ? `Aujourd'hui, ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Consultez le menu de la semaine'}</p>
            </div>
             {weeklyMenu && !isLoading && (
                <button
                    onClick={handleDownloadPdf}
                    disabled={isPrinting}
                    className="bg-agria-green hover:bg-agria-green-dark text-white font-semibold py-2 px-4 border border-transparent rounded-lg shadow-sm transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2 disabled:opacity-50 self-start sm:self-center"
                >
                    {isPrinting ? <SpinnerIcon size="small" /> : <DownloadIcon className="h-5 w-5" />}
                    {isPrinting ? 'Génération...' : 'Menu de la semaine (PDF)'}
                </button>
            )}
        </div>
        
        <div className="mt-8">
            {renderContent()}
        </div>

      <ImageModal 
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.src || null}
        altText={selectedImage?.alt}
      />
      
      <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .cursor-zoom-in { cursor: zoom-in; }`}</style>
    </div>
  );
};

export default Menu;