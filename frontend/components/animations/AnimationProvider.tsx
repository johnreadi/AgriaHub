import React, { createContext, useContext, useState, useEffect } from 'react';

interface AnimationContextType {
  isReducedMotion: boolean;
  animationSpeed: number;
  enableAnimations: boolean;
  setAnimationSpeed: (speed: number) => void;
  setEnableAnimations: (enable: boolean) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

interface AnimationProviderProps {
  children: React.ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [enableAnimations, setEnableAnimations] = useState(true);

  const value = {
    isReducedMotion,
    animationSpeed,
    enableAnimations,
    setAnimationSpeed,
    setEnableAnimations,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// Hook pour obtenir les variants d'animation adaptés
export const useAnimationVariants = () => {
  const context = useContext(AnimationContext);
  
  if (!context) {
    throw new Error('useAnimationVariants must be used within an AnimationProvider');
  }

  const { enableAnimations, animationSpeed, isReducedMotion } = context;

  const getVariants = (baseVariants: any) => {
    if (!enableAnimations || isReducedMotion) {
      // Retourner des variants sans animation
      return {
        initial: baseVariants.visible || {},
        animate: baseVariants.visible || {},
        exit: baseVariants.visible || {},
      };
    }

    return baseVariants;
  };

  return { getVariants, enableAnimations, animationSpeed };
};