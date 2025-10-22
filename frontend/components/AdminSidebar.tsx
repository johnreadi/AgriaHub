import React from 'react';
import { ADMIN_SIDEBAR_LINKS } from '../constants';
import type { SidebarLink } from '../types';
import { CloseIcon, ArrowLeftIcon } from './icons/Icons';

interface AdminSidebarProps {
  activeRoute: string;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeRoute, onLogout, isOpen, onClose }) => {

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.hash = href;
    onClose();
  };

  return (
    <aside className={`bg-gray-800 text-gray-300 flex flex-col w-64 flex-shrink-0 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
        <div className="text-white font-bold text-xl">AGRIA ADMIN</div>
         <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white" aria-label="Fermer le menu">
            <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {ADMIN_SIDEBAR_LINKS.map((link: SidebarLink) => {
          const isActive = activeRoute.startsWith(link.href);
          return (
            <a
              key={`${link.href}-${link.name}`}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-agria-green text-white font-semibold'
                  : 'hover:bg-gray-700 hover:text-white'
              }`}
            >
              <link.icon className="h-5 w-5 mr-3" />
              <span>{link.name}</span>
            </a>
          );
        })}
      </nav>

      <div className="px-2 py-4 border-t border-gray-700">
        <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = '#' }} className="flex items-center p-2 rounded-md hover:bg-gray-700 hover:text-white">
            <ArrowLeftIcon />
            <span className="ml-3">Retour au site</span>
        </a>
        <button
          onClick={onLogout}
          className="w-full flex items-center p-2 mt-2 rounded-md text-red-400 hover:bg-red-500 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;