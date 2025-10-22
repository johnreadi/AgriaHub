import React, { useRef, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAnimation } from './AnimationProvider';

// Hook pour détecter si un élément est visible
export const useScrollAnimation = (threshold = 0.1, triggerOnce = true) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    threshold, 
    once: triggerOnce,
    margin: "-100px 0px -100px 0px"
  });
  
  return { ref, isInView };
};

// Composant de révélation au scroll
interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  triggerOnce?: boolean;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 50,
  threshold = 0.1,
  triggerOnce = true,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();
  const { ref, isInView } = useScrollAnimation(threshold, triggerOnce);

  const getVariants = () => {
    const variants = {
      hidden: {},
      visible: {
        opacity: 1,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    };

    switch (direction) {
      case 'up':
        variants.hidden = { opacity: 0, y: distance };
        variants.visible = { ...variants.visible, y: 0 };
        break;
      case 'down':
        variants.hidden = { opacity: 0, y: -distance };
        variants.visible = { ...variants.visible, y: 0 };
        break;
      case 'left':
        variants.hidden = { opacity: 0, x: distance };
        variants.visible = { ...variants.visible, x: 0 };
        break;
      case 'right':
        variants.hidden = { opacity: 0, x: -distance };
        variants.visible = { ...variants.visible, x: 0 };
        break;
      case 'scale':
        variants.hidden = { opacity: 0, scale: 0.8 };
        variants.visible = { ...variants.visible, scale: 1 };
        break;
      default:
        variants.hidden = { opacity: 0 };
        break;
    }

    return variants;
  };

  if (!enableAnimations) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={getVariants()}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Composant de stagger pour listes
interface ScrollStaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  threshold?: number;
  className?: string;
}

export const ScrollStagger: React.FC<ScrollStaggerProps> = ({
  children,
  staggerDelay = 0.1,
  threshold = 0.1,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();
  const { ref, isInView } = useScrollAnimation(threshold);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  if (!enableAnimations) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Effet de parallaxe
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  if (!enableAnimations) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      style={{ y: smoothY }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Compteur animé
interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  threshold?: number;
}

export const AnimatedCounter: React.FC<CounterProps> = ({
  from = 0,
  to,
  duration = 2,
  suffix = '',
  prefix = '',
  className = '',
  threshold = 0.3,
}) => {
  const { enableAnimations } = useAnimation();
  const { ref, isInView } = useScrollAnimation(threshold);
  const [count, setCount] = React.useState(from);

  useEffect(() => {
    if (!isInView || !enableAnimations) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(from + (to - from) * easeOutQuart);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, from, to, duration, enableAnimations]);

  useEffect(() => {
    if (!enableAnimations && isInView) {
      setCount(to);
    }
  }, [enableAnimations, isInView, to]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Barre de progression animée
interface ProgressBarProps {
  value: number;
  max?: number;
  height?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  className?: string;
  threshold?: number;
}

export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 'h-2',
  color = 'primary',
  showValue = false,
  className = '',
  threshold = 0.3,
}) => {
  const { enableAnimations } = useAnimation();
  const { ref, isInView } = useScrollAnimation(threshold);
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    primary: 'bg-emerald-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  return (
    <div ref={ref} className={`w-full ${className}`}>
      {showValue && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
          transition={{
            duration: enableAnimations ? 1.5 : 0,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.2,
          }}
          className={`${height} ${colorClasses[color]} rounded-full relative overflow-hidden`}
        >
          {enableAnimations && (
            <motion.div
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-transparent opacity-30"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Texte qui s'écrit
interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  className?: string;
  threshold?: number;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  className = '',
  threshold = 0.3,
}) => {
  const { enableAnimations } = useAnimation();
  const { ref, isInView } = useScrollAnimation(threshold);
  const [displayText, setDisplayText] = React.useState('');
  const [showCursor, setShowCursor] = React.useState(true);

  useEffect(() => {
    if (!isInView) return;

    if (!enableAnimations) {
      setDisplayText(text);
      setShowCursor(false);
      return;
    }

    const timeout = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        setDisplayText(text.slice(0, index + 1));
        index++;
        
        if (index >= text.length) {
          clearInterval(interval);
          if (!cursor) setShowCursor(false);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, text, speed, delay, cursor, enableAnimations]);

  // Animation du curseur
  useEffect(() => {
    if (!cursor || !enableAnimations) return;

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [cursor, enableAnimations]);

  return (
    <span ref={ref} className={className}>
      {displayText}
      {cursor && showCursor && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

// Morphing de formes SVG
interface MorphingShapeProps {
  shapes: string[];
  duration?: number;
  className?: string;
  threshold?: number;
}

export const MorphingShape: React.FC<MorphingShapeProps> = ({
  shapes,
  duration = 2,
  className = '',
  threshold = 0.3,
}) => {
  const { enableAnimations } = useAnimation();
  const { ref, isInView } = useScrollAnimation(threshold);
  const [currentShape, setCurrentShape] = React.useState(0);

  useEffect(() => {
    if (!isInView || !enableAnimations || shapes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentShape(prev => (prev + 1) % shapes.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [isInView, shapes.length, duration, enableAnimations]);

  if (!enableAnimations) {
    return (
      <svg ref={ref} className={className} viewBox="0 0 100 100">
        <path d={shapes[0]} fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg ref={ref} className={className} viewBox="0 0 100 100">
      <motion.path
        d={shapes[currentShape]}
        fill="currentColor"
        animate={{ d: shapes[currentShape] }}
        transition={{
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      />
    </svg>
  );
};

// Révélation de texte mot par mot
interface WordRevealProps {
  text: string;
  delay?: number;
  staggerDelay?: number;
  className?: string;
  threshold?: number;
}

export const WordReveal: React.FC<WordRevealProps> = ({
  text,
  delay = 0,
  staggerDelay = 0.1,
  className = '',
  threshold = 0.3,
}) => {
  const { enableAnimations } = useAnimation();
  const { ref, isInView } = useScrollAnimation(threshold);
  const words = text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  if (!enableAnimations) {
    return <div ref={ref} className={className}>{text}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};