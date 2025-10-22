import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MenuIcon } from './icons/Icons';

interface HeaderProps {
  onMenuToggle: () => void;
}

const APPEARANCE_SETTINGS_KEY = 'agria-appearance-settings';

// Variantes d'animations pour le header
const headerVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.6
    }
  }
};

const logoVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15,
      delay: 0.2
    }
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  hidden: { x: 50, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay: 0.4
    }
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const menuButtonVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay: 0.3
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

// Composant LogoContent mémorisé avec animations
const LogoContent = React.memo<{ logo: string | null; siteTitle: string }>(({ logo, siteTitle }) => (
  logo ? (
    <motion.img 
      src={logo} 
      alt="Logo Agria Rouen" 
      className="h-[95%] w-auto object-contain"
      loading="eager"
      decoding="async"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    />
  ) : (
    <motion.span 
      className="text-xl font-bold uppercase tracking-wide custom-header-title-text"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {siteTitle}
    </motion.span>
  )
));

const Header = React.memo<HeaderProps>(({ onMenuToggle }) => {
  const [logo, setLogo] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState<string>('AGRIA ROUEN');

  // Mémoriser la fonction de gestion du storage
  const handleStorageChange = useCallback(() => {
    try {
      const savedAppearance = localStorage.getItem(APPEARANCE_SETTINGS_KEY);
      if (savedAppearance) {
        const settings = JSON.parse(savedAppearance);
        setLogo(settings.logo || null);
        setSiteTitle(settings.header?.titleText || 'AGRIA ROUEN');
      }
    } catch (e) {
      console.error("Failed to load appearance settings for header", e);
    }
  }, []);

  useEffect(() => {
    // Charger les paramètres initiaux
    handleStorageChange();
    
    // Écouter les changements depuis le panneau admin
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleStorageChange]);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      window.location.hash = href;
    }
  }, []);
  
  return (
    <motion.header 
      className="custom-header backdrop-blur-sm border-b border-gray-200/75 sticky top-0 z-20"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full px-4 sm:px-6 md:px-10 h-20 flex justify-between items-center relative">
        {/* Left: Hamburger menu (mobile) / Desktop Logo */}
        <div className="flex items-center h-full">
          <motion.button
            onClick={onMenuToggle}
            className="md:hidden text-gray-600 hover:text-agria-green"
            aria-label="Ouvrir le menu"
            variants={menuButtonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            <MenuIcon className="h-6 w-6" />
          </motion.button>
          <motion.a 
            href="#" 
            onClick={(e) => handleNavClick(e, '#')} 
            className="hidden md:flex items-center h-full"
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
             <LogoContent logo={logo} siteTitle={siteTitle} />
           </motion.a>
        </div>

        {/* Center: Mobile Logo */}
         <div className="md:hidden absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-full py-2">
             <motion.a 
               href="#" 
               onClick={(e) => handleNavClick(e, '#')} 
               className="flex items-center justify-center h-full"
               variants={logoVariants}
               initial="hidden"
               animate="visible"
               whileHover="hover"
             >
                 <LogoContent logo={logo} siteTitle={siteTitle} />
             </motion.a>
         </div>
        
        {/* Right: Buttons (desktop) */}
        <motion.div 
          className="hidden md:flex items-center space-x-2 sm:space-x-4"
          initial="hidden"
          animate="visible"
        >
           <motion.a
            href="#manger"
            onClick={(e) => handleNavClick(e, '#manger')}
            className="bg-agria-green hover:bg-agria-green-dark text-white font-semibold px-4 sm:px-5 py-2.5 rounded-md transition-colors duration-200 text-sm sm:text-base shadow-sm"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Inscription
          </motion.a>
          <motion.a
            href="#admin"
            onClick={(e) => handleNavClick(e, '#admin')}
            className="text-gray-600 hover:text-agria-green font-semibold px-4 sm:px-5 py-2.5 rounded-md border border-gray-300 hover:border-agria-green transition-colors duration-200 text-sm sm:text-base"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Connexion
          </motion.a>
        </motion.div>
        
        {/* Placeholder to balance the hamburger icon on mobile for centering */}
        <div className="md:hidden w-6 h-6"></div>
      </div>
    </motion.header>
  );
});

export default Header;