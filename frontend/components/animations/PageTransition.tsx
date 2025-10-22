import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation, useAnimationVariants } from './AnimationProvider';
import { pageTransition, slidePageTransition } from './AnimationVariants';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionKey: string;
  type?: 'fade' | 'slide' | 'scale';
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  transitionKey,
  type = 'fade',
  direction = 'right',
}) => {
  const { getVariants } = useAnimationVariants();

  const getTransitionVariants = () => {
    switch (type) {
      case 'slide':
        return getVariants(slidePageTransition);
      case 'scale':
        return getVariants({
          initial: { opacity: 0, scale: 0.9 },
          in: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
          },
          out: { 
            opacity: 0, 
            scale: 1.1,
            transition: { duration: 0.4 }
          },
        });
      default:
        return getVariants(pageTransition);
    }
  };

const variants = getTransitionVariants();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial="initial"
        animate="in"
        exit="out"
        variants={variants}
        className={`w-full ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Hook pour les transitions de page avec router
export const usePageTransition = () => {
  const { enableAnimations } = useAnimation();

  const getPageKey = (pathname: string) => {
    return enableAnimations ? pathname : 'static';
  };

  return { getPageKey, enableAnimations };
};

// Composant pour les transitions de section
interface SectionTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

export const SectionTransition: React.FC<SectionTransitionProps> = ({
  children,
  className = '',
  delay = 0,
  threshold = 0.1,
}) => {
  const { getVariants } = useAnimationVariants();

  const variants = getVariants({
    hidden: { 
      opacity: 0, 
      y: 60 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        delay,
        ease: [0.6, -0.05, 0.01, 0.99],
      }
    },
  });

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Composant pour les transitions de liste avec stagger
interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  childDelay?: number;
}

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  childDelay = 0.2,
}) => {
  const { getVariants } = useAnimationVariants();

  const containerVariants = getVariants({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: childDelay,
      },
    },
  });

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Composant pour les éléments de liste avec animation
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  index = 0,
}) => {
  const { getVariants } = useAnimationVariants();

  const variants = getVariants({
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.6, -0.05, 0.01, 0.99],
      }
    },
  });

  return (
    <motion.div
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Composant pour les révélations de texte
interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}) => {
  const { getVariants } = useAnimationVariants();

  const getDirectionOffset = () => {
    switch (direction) {
      case 'down': return { y: -30 };
      case 'left': return { x: 30 };
      case 'right': return { x: -30 };
      default: return { y: 30 };
    }
  };

  const offset = getDirectionOffset();

  const variants = getVariants({
    hidden: { 
      opacity: 0,
      ...offset,
    },
    visible: { 
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.8,
        delay,
        ease: [0.6, -0.05, 0.01, 0.99],
      }
    },
  });

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Composant pour les animations de parallax
interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  className = '',
  offset = 50,
}) => {
  const { enableAnimations } = useAnimation();

  if (!enableAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ y: offset }}
      whileInView={{ y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export { Parallax as ParallaxElement };