import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SIDEBAR_LINKS } from '../constants';
import type { SidebarLink } from '../types';
import { CloseIcon } from './icons/Icons';

interface SidebarProps {
  activeRoute: string;
  isOpen: boolean;
  onClose: () => void;
  onRechargeClick: () => void;
}

// Variantes d'animations pour la sidebar
const sidebarVariants = {
  closed: {
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40
    }
  },
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 40
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.3
    }
  }
};

const navVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.2,
      staggerChildren: 0.1
    }
  }
};

const linkVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    x: 4,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.4,
      duration: 0.3
    }
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const closeButtonVariants = {
  hidden: { opacity: 0, rotate: -90 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: {
      delay: 0.15,
      duration: 0.3
    }
  },
  hover: {
    scale: 1.1,
    rotate: 90,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.9,
    transition: { duration: 0.1 }
  }
};

const Sidebar: React.FC<SidebarProps> = ({ activeRoute, isOpen, onClose, onRechargeClick }) => {
  
  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (href === '#recharge') {
      e.preventDefault();
      onRechargeClick();
    } else if (href.startsWith('#')) {
      e.preventDefault();
      window.location.hash = href;
    }
    // Ne fermer la sidebar que sur mobile pour éviter sa disparition sur desktop
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      onClose();
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isOpen && isMobile) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      <motion.aside
        key="sidebar"
        className={`bg-white shadow-xl border-r border-gray-200 flex-col flex-shrink-0 w-64
          fixed inset-y-0 left-0 z-50
          md:relative md:translate-x-0 md:z-50
          custom-sidebar
          ${isOpen ? 'flex' : 'hidden md:flex'}
        `}
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
      >
        <motion.div 
          className="h-16 flex items-center justify-between px-4 border-b border-gray-200"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="md:hidden w-6 h-6"></div>
          <motion.h2 
            className="text-lg font-bold text-gray-700 custom-sidebar-title text-center md:text-left"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Menu Principal
          </motion.h2>
          <motion.button 
            onClick={onClose} 
            className="md:hidden text-gray-500 hover:text-gray-800" 
            aria-label="Fermer le menu"
            variants={closeButtonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            <CloseIcon className="h-6 w-6" />
          </motion.button>
        </motion.div>

        <motion.nav 
          className="flex-1 p-4 overflow-y-auto"
          variants={navVariants}
          initial="hidden"
          animate="visible"
        >
          <ul>
            {SIDEBAR_LINKS.map((link: SidebarLink, index: number) => {
              const isActive = activeRoute === link.href;
              return (
                <motion.li 
                  key={`${link.href}-${index}`}
                  variants={linkVariants}
                  custom={index}
                >
                  <motion.a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className={`flex items-center p-3 my-1 rounded-lg transition-colors custom-sidebar-link ${
                      isActive
                        ? 'bg-agria-green text-white font-semibold shadow-sm active-link'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                    variants={linkVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <motion.div
                      initial={{ rotate: 0 }}
                      whileHover={{ rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <link.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    </motion.div>
                    <span>{link.name}</span>
                  </motion.a>
                </motion.li>
              );
            })}
          </ul>
        </motion.nav>

        <motion.div 
          className="p-4 border-t border-gray-200 md:hidden"
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="space-y-3">
            <motion.a
              href="#manger"
              onClick={(e) => handleLinkClick(e, '#manger')}
              className="block w-full text-center bg-agria-green hover:bg-agria-green-dark text-white font-semibold px-4 py-2.5 rounded-md transition-colors duration-200 text-sm shadow-sm"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Inscription
            </motion.a>
            <motion.a
              href="#admin"
              onClick={(e) => handleLinkClick(e, '#admin')}
              className="block w-full text-center text-gray-600 hover:text-agria-green font-semibold px-4 py-2.5 rounded-md border border-gray-300 hover:border-agria-green transition-colors duration-200 text-sm"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Connexion
            </motion.a>
          </div>
        </motion.div>
      </motion.aside>
      {isOpen && (
        <motion.div
          key="overlay"
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200 ease-out"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
    </AnimatePresence>
  );
};

export default Sidebar;