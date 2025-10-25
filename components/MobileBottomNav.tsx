import React from 'react';
import { motion } from 'framer-motion';
import { BOTTOM_NAV_LINKS } from '../constants';
import type { SidebarLink } from '../types';

interface MobileBottomNavProps {
  activeRoute: string;
}

// Variantes d'animations pour la navigation mobile
const navVariants = {
  hidden: { y: 100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 15
    }
  },
  hover: {
    y: -2,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

const iconVariants = {
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.9,
    transition: { duration: 0.1 }
  }
};

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeRoute }) => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.location.hash = href;
  };

  return (
    <motion.nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30"
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-around items-center h-16">
        {BOTTOM_NAV_LINKS.map((link: SidebarLink, index: number) => {
          const isActive = activeRoute === link.href;
          return (
            <motion.a
              key={`${link.href}-${index}`}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`flex flex-col items-center justify-center w-full text-center transition-colors duration-200 ${
                isActive ? 'text-agria-green' : 'text-gray-500 hover:text-agria-green-dark'
              }`}
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              custom={index}
            >
              <motion.div
                variants={iconVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <link.icon className="h-6 w-6 mb-1" />
              </motion.div>
              <motion.span 
                className="text-xs font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                {link.name}
              </motion.span>
            </motion.a>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
