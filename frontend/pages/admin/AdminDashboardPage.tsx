

import React, { useState, useEffect, useMemo } from 'react';
import { 
    ClipboardListIcon, 
    UsersIcon,
    MailIcon,
    SettingsIcon
} from '../../components/icons/Icons';
import type { WeeklyMenu, SiteActivity, ActivityCategory } from '../../types';

const MENU_STORAGE_KEY = 'weeklyMenu';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; href: string }> = ({ title, value, icon, href }) => {
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        window.location.hash = href;
    };

    return (
        <a href={href} onClick={(e) => handleNavClick(e, href)} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg hover:border-agria-green border-2 border-transparent transition-all transform hover:-translate-y-1">
            <div className="flex items-center">
                <div className="p-3 bg-agria-green-dark text-white rounded-full mr-4">
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                </div>
            </div>
        </a>
    );
};

// --- Mock Activity Generator ---
const generateMockActivities = (): SiteActivity[] => {
    const now = new Date();
    const activities: SiteActivity[] = [
        { id: '2', category: 'Menu', description: 'Le menu de la semaine a été sauvegardé.', user: 'Admin', timestamp: new Date(now.getTime() - 25 * 60000), icon: ClipboardListIcon },
        { id: '3', category: 'Messages', description: 'Nouveau message reçu de Bob Dubois.', user: 'Bob Dubois', timestamp: new Date(now.getTime() - 1 * 3600000), icon: MailIcon },
        { id: '4', category: 'Utilisateurs', description: 'Le statut de Bob Dubois est passé à "En attente".', user: 'Admin', timestamp: new Date(now.getTime() - 2 * 3600000), icon: UsersIcon },
        { id: '6', category: 'Menu', description: 'Génération d\'un nouveau menu par l\'IA.', user: 'Admin', timestamp: new Date(now.getTime() - 8 * 3600000), icon: ClipboardListIcon },
        { id: '7', category: 'Paramètres', description: 'Les informations du restaurant ont été mises à jour.', user: 'Admin', timestamp: new Date(now.getTime() - 24 * 3600000), icon: SettingsIcon },
        { id: '8', category: 'Utilisateurs', description: 'L\'utilisateur Fiona Garcia a été ajouté.', user: 'Admin', timestamp: new Date(now.getTime() - 28 * 3600000), icon: UsersIcon },
    ];
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// --- Time formatting helper ---
const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `il y a ${Math.floor(interval)} an(s)`;
    interval = seconds / 2592000;
    if (interval > 1) return `il y a ${Math.floor(interval)} mois`;
    interval = seconds / 86400;
    if (interval > 1) return `il y a ${Math.floor(interval)} jour(s)`;
    interval = seconds / 3600;
    if (interval > 1) return `il y a ${Math.floor(interval)} heure(s)`;
    interval = seconds / 60;
    if (interval > 1) return `il y a ${Math.floor(interval)} minute(s)`;
    return "à l'instant";
};


const AdminDashboardPage: React.FC = () => {
    const [menuStatus, setMenuStatus] = useState('Non défini');
    const [activities] = useState<SiteActivity[]>(generateMockActivities());
    const [activeTab, setActiveTab] = useState<'Tout' | ActivityCategory>('Tout');

    // Debug log
    console.log('AdminDashboardPage rendering...', { menuStatus, activities: activities.length });

    useEffect(() => {
        console.log('AdminDashboardPage mounted');
        // Check menu status
        const savedMenu = localStorage.getItem(MENU_STORAGE_KEY);
        setMenuStatus(savedMenu ? 'Publié' : 'Non généré');
        
    }, []);

    const filteredActivities = useMemo(() => {
        if (activeTab === 'Tout') {
            return activities;
        }
        return activities.filter(activity => activity.category === activeTab);
    }, [activities, activeTab]);
    
    const TABS: Array<'Tout' | ActivityCategory> = ['Tout', 'Menu', 'Utilisateurs', 'Messages', 'Paramètres'];

    return (
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Tableau de bord</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard 
                    title="Statut du Menu"
                    value={menuStatus}
                    icon={<ClipboardListIcon className="h-6 w-6"/>}
                    href="#admin/menu"
                 />
                 {/* Add more stat cards here */}
            </div>

            <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Accès Rapides</h2>
                <div className="flex flex-wrap gap-4">
                    <a href="#admin/menu" onClick={(e)=>{e.preventDefault(); window.location.hash='#admin/menu'}} className="bg-agria-green hover:bg-agria-green-dark text-white font-bold py-2 px-4 rounded transition-colors">Gérer le Menu</a>
                     <a href="#" onClick={(e)=>{e.preventDefault(); window.location.hash='#'}} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors">Voir le site public</a>
                </div>
            </div>

            <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Activités récentes du site</h2>
                
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {TABS.map(tabName => (
                            <button
                                key={tabName}
                                onClick={() => setActiveTab(tabName)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tabName
                                        ? 'border-agria-green text-agria-green-dark'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tabName}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <ul className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-2">
                    {filteredActivities.length > 0 ? filteredActivities.map(activity => (
                        <li key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50">
                            <div className="flex-shrink-0 mt-1">
                                <span className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100 text-agria-green">
                                    <activity.icon className="h-5 w-5" />
                                </span>
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm text-gray-800">{activity.description}</p>
                                <p className="text-xs text-gray-500">
                                    {activity.user && `par ${activity.user} • `}{formatTimeAgo(activity.timestamp)}
                                </p>
                            </div>
                        </li>
                    )) : (
                        <li className="text-center text-gray-500 py-10">
                            Aucune activité dans cette catégorie.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AdminDashboardPage;