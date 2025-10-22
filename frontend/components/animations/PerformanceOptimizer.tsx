import React, { useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

// Hook pour détecter les performances du dispositif
const useDevicePerformance = () => {
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast');

  useEffect(() => {
    // Détecter les performances basées sur le hardware
    const detectPerformance = () => {
      // Vérifier le nombre de cœurs CPU
      const cores = navigator.hardwareConcurrency || 2;
      
      // Vérifier la mémoire disponible (si supporté)
      const memory = (navigator as any).deviceMemory || 4;
      
      // Vérifier la connexion réseau
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        setConnectionSpeed(effectiveType === '4g' || effectiveType === '3g' ? 'fast' : 'slow');
      }

      // Déterminer si c'est un dispositif bas de gamme
      const isLowEnd = cores < 4 || memory < 4;
      setIsLowPerformance(isLowEnd);
    };

    detectPerformance();

    // Écouter les changements de connexion
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', detectPerformance);
      return () => connection.removeEventListener('change', detectPerformance);
    }
  }, []);

  return { isLowPerformance, connectionSpeed };
};

// Hook pour optimiser les animations selon les performances
export const useOptimizedAnimations = () => {
  const shouldReduceMotion = useReducedMotion();
  const { isLowPerformance, connectionSpeed } = useDevicePerformance();
  
  const getOptimizedVariants = useCallback((variants: any) => {
    if (shouldReduceMotion) {
      // Désactiver toutes les animations si l'utilisateur préfère les mouvements réduits
      return {
        ...variants,
        animate: variants.initial || {},
        transition: { duration: 0 }
      };
    }

    if (isLowPerformance || connectionSpeed === 'slow') {
      // Réduire la complexité des animations pour les dispositifs bas de gamme
      return {
        ...variants,
        transition: {
          ...variants.transition,
          duration: (variants.transition?.duration || 0.3) * 0.5,
          ease: 'linear' // Utiliser des easings plus simples
        }
      };
    }

    return variants;
  }, [shouldReduceMotion, isLowPerformance, connectionSpeed]);

  const shouldUseGPU = !isLowPerformance;
  const shouldPreloadAnimations = connectionSpeed === 'fast' && !isLowPerformance;

  return {
    getOptimizedVariants,
    shouldUseGPU,
    shouldPreloadAnimations,
    isLowPerformance,
    shouldReduceMotion
  };
};

// Composant wrapper pour optimiser automatiquement les performances
const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  const { shouldUseGPU, isLowPerformance } = useOptimizedAnimations();

  useEffect(() => {
    // Appliquer les optimisations CSS globales
    const style = document.createElement('style');
    style.textContent = `
      ${shouldUseGPU ? `
        .motion-element {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
          will-change: transform, opacity;
        }
      ` : `
        .motion-element {
          will-change: auto;
        }
      `}
      
      ${isLowPerformance ? `
        * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
        
        .complex-animation {
          display: none;
        }
      ` : ''}
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [shouldUseGPU, isLowPerformance]);

  return <>{children}</>;
};

// Hook pour lazy loading des animations
export const useLazyAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref);
        }
      },
      { threshold }
    );

    observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, threshold]);

  return { ref: setRef, isVisible };
};

// Composant pour les animations lazy
export const LazyMotion: React.FC<{
  children: React.ReactNode;
  variants?: any;
  className?: string;
  threshold?: number;
}> = ({ children, variants, className, threshold = 0.1 }) => {
  const { ref, isVisible } = useLazyAnimation(threshold);
  const { getOptimizedVariants } = useOptimizedAnimations();

  const optimizedVariants = variants ? getOptimizedVariants(variants) : undefined;

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={optimizedVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
};

// Hook pour batching des animations
export const useAnimationBatch = () => {
  const [animationQueue, setAnimationQueue] = useState<(() => void)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addAnimation = useCallback((animation: () => void) => {
    setAnimationQueue(prev => [...prev, animation]);
  }, []);

  useEffect(() => {
    if (animationQueue.length > 0 && !isProcessing) {
      setIsProcessing(true);
      
      // Traiter les animations par batch
      requestAnimationFrame(() => {
        const batch = animationQueue.slice(0, 3); // Traiter 3 animations max par frame
        batch.forEach(animation => animation());
        
        setAnimationQueue(prev => prev.slice(3));
        setIsProcessing(false);
      });
    }
  }, [animationQueue, isProcessing]);

  return { addAnimation };
};

// Composant pour précharger les animations critiques
export const AnimationPreloader: React.FC = () => {
  const { shouldPreloadAnimations } = useOptimizedAnimations();

  useEffect(() => {
    if (!shouldPreloadAnimations) return;

    // Précharger les animations critiques
    const preloadAnimations = () => {
      const criticalAnimations = [
        'fadeIn', 'slideIn', 'scaleIn'
      ];

      criticalAnimations.forEach(animation => {
        const element = document.createElement('div');
        element.style.opacity = '0';
        element.style.position = 'absolute';
        element.style.top = '-9999px';
        element.className = `animate-${animation}`;
        
        document.body.appendChild(element);
        
        setTimeout(() => {
          document.body.removeChild(element);
        }, 100);
      });
    };

    // Précharger après le chargement initial
    setTimeout(preloadAnimations, 1000);
  }, [shouldPreloadAnimations]);

  return null;
};

export default PerformanceOptimizer;