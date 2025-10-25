// Animation Provider et hooks
export { AnimationProvider, useAnimation } from './AnimationProvider';

// Variantes d'animations
export * from './AnimationVariants';

// Transitions de pages
export {
  PageTransition,
  SectionTransition,
  StaggerList,
  StaggerItem,
  TextReveal,
  Parallax,
} from './PageTransition';

// Éléments interactifs
export {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  AnimatedBadge,
  AnimatedTooltip,
  AnimatedProgress,
} from './InteractiveElements';

// Animations de chargement
export {
  Spinner,
  DotsLoader,
  PulseLoader,
  WaveLoader,
  Skeleton,
  CardSkeleton,
  LoadingOverlay,
  ProgressLoader,
  ContentLoader,
} from './LoadingAnimations';

// Animations de scroll
export {
  useScrollAnimation,
  ScrollReveal,
  ScrollStagger,
  AnimatedCounter,
  AnimatedProgressBar,
  Typewriter,
  MorphingShape,
  WordReveal,
  Parallax as ScrollParallax,
} from './ScrollAnimations';

// Animations de gestes
export {
  Swipeable,
  SwipeCard,
  PinchZoom,
  PressableButton,
  DraggableSlider,
  Rotatable,
  CircularMenu,
  PullToRefresh,
  LongPress,
} from './GestureAnimations';

// Types utiles
export interface AnimationConfig {
  enableAnimations: boolean;
  animationSpeed: number;
  reducedMotion: boolean;
}

export interface AnimationVariant {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
}

// Constantes d'animations
export const ANIMATION_DURATIONS = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

export const EASING = {
  easeOut: [0.25, 0.46, 0.45, 0.94],
  easeIn: [0.55, 0.06, 0.68, 0.19],
  easeInOut: [0.42, 0, 0.58, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// Utilitaires d'animations
export const createStaggerVariants = (staggerDelay = 0.1) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export const createFadeVariants = (direction: 'up' | 'down' | 'left' | 'right' = 'up', distance = 20) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
      case 'left': return { x: distance };
      case 'right': return { x: -distance };
      default: return { y: distance };
    }
  };

  return {
    hidden: {
      opacity: 0,
      ...getInitialPosition(),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: EASING.easeOut,
      },
    },
  };
};

export const createScaleVariants = (initialScale = 0.8) => ({
  hidden: {
    opacity: 0,
    scale: initialScale,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: EASING.easeOut,
    },
  },
});

export const createSlideVariants = (direction: 'left' | 'right' | 'up' | 'down' = 'left') => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: '-100%' };
      case 'right': return { x: '100%' };
      case 'up': return { y: '-100%' };
      case 'down': return { y: '100%' };
      default: return { x: '-100%' };
    }
  };

  return {
    hidden: getInitialPosition(),
    visible: {
      x: 0,
      y: 0,
      transition: {
        duration: 0.3,
        ease: EASING.easeOut,
      },
    },
    exit: getInitialPosition(),
  };
};