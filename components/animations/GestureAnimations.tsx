import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useAnimation } from './AnimationProvider';

// Composant de glissement (swipe)
interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;

    // Détection du swipe horizontal
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      if (offset.x > threshold || velocity.x > 500) {
        onSwipeRight?.();
      } else if (offset.x < -threshold || velocity.x < -500) {
        onSwipeLeft?.();
      }
    }
    // Détection du swipe vertical
    else {
      if (offset.y > threshold || velocity.y > 500) {
        onSwipeDown?.();
      } else if (offset.y < -threshold || velocity.y < -500) {
        onSwipeUp?.();
      }
    }
  };

  if (!enableAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 0.95 }}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Carte glissable (comme Tinder)
interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  className?: string;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();
  const [exitX, setExitX] = useState(0);
  const [exitY, setExitY] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      setExitX(200);
      onSwipeRight?.();
    } else if (info.offset.x < -threshold) {
      setExitX(-200);
      onSwipeLeft?.();
    } else if (info.offset.y < -threshold) {
      setExitY(-200);
      onSwipeUp?.();
    }
  };

  if (!enableAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX, y: exitY }}
      transition={{ duration: 0.3 }}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Composant de pincement (pinch to zoom)
interface PinchZoomProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export const PinchZoom: React.FC<PinchZoomProps> = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();
  const [scale, setScale] = useState(1);

  if (!enableAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      style={{ scale }}
      onPinch={(event, info) => {
        const newScale = Math.min(Math.max(info.scale, minScale), maxScale);
        setScale(newScale);
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Bouton avec effet de pression
interface PressableButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  pressScale?: number;
  className?: string;
  disabled?: boolean;
}

export const PressableButton: React.FC<PressableButtonProps> = ({
  children,
  onClick,
  pressScale = 0.95,
  className = '',
  disabled = false,
}) => {
  const { enableAnimations } = useAnimation();

  const buttonVariants = {
    idle: { scale: 1 },
    pressed: { scale: pressScale },
    hover: { scale: 1.05 },
  };

  if (!enableAnimations || disabled) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      variants={buttonVariants}
      initial="idle"
      whileHover={!disabled ? "hover" : "idle"}
      whileTap={!disabled ? "pressed" : "idle"}
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </motion.button>
  );
};

// Slider glissable
interface DraggableSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const DraggableSlider: React.FC<DraggableSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (event: any, info: PanInfo) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, info.point.x / rect.width));
    const newValue = Math.round((min + percentage * (max - min)) / step) * step;
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  const percentage = ((value - min) / (max - min)) * 100;

  if (!enableAnimations) {
    return (
      <div className={`relative h-2 bg-gray-200 rounded-full ${className}`}>
        <div
          className="absolute h-full bg-emerald-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-emerald-600 rounded-full transform -translate-y-1"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    );
  }

  return (
    <div className={`relative h-2 bg-gray-200 rounded-full cursor-pointer ${className}`}>
      <motion.div
        className="absolute h-full bg-emerald-600 rounded-full"
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        onDrag={handleDrag}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        whileDrag={{ scale: 1.2 }}
        className="absolute w-4 h-4 bg-white border-2 border-emerald-600 rounded-full transform -translate-y-1 cursor-grab active:cursor-grabbing"
        style={{ left: `calc(${percentage}% - 8px)` }}
        animate={{
          boxShadow: isDragging
            ? '0 4px 12px rgba(0, 0, 0, 0.15)'
            : '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      />
    </div>
  );
};

// Composant de rotation par geste
interface RotatableProps {
  children: React.ReactNode;
  onRotate?: (angle: number) => void;
  className?: string;
}

export const Rotatable: React.FC<RotatableProps> = ({
  children,
  onRotate,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();
  const [rotation, setRotation] = useState(0);

  const handleDrag = (event: any, info: PanInfo) => {
    const centerX = event.currentTarget.offsetWidth / 2;
    const centerY = event.currentTarget.offsetHeight / 2;
    
    const angle = Math.atan2(
      info.point.y - centerY,
      info.point.x - centerX
    ) * (180 / Math.PI);
    
    setRotation(angle);
    onRotate?.(angle);
  };

  if (!enableAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      drag
      onDrag={handleDrag}
      style={{ rotate: rotation }}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Menu circulaire avec gestes
interface CircularMenuProps {
  items: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const CircularMenu: React.FC<CircularMenuProps> = ({
  items,
  isOpen,
  onToggle,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();

  const menuVariants = {
    closed: {
      scale: 0,
      rotate: -180,
    },
    open: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    closed: {
      scale: 0,
      rotate: -90,
    },
    open: {
      scale: 1,
      rotate: 0,
    },
  };

  const getItemPosition = (index: number, total: number) => {
    const angle = (index * 360) / total;
    const radius = 80;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { x, y };
  };

  if (!enableAnimations) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={onToggle}
          className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center"
        >
          +
        </button>
        {isOpen && (
          <div className="absolute inset-0">
            {items.map((item, index) => {
              const { x, y } = getItemPosition(index, items.length);
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="absolute w-10 h-10 bg-white border-2 border-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                  title={item.label}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center z-10 relative"
      >
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          +
        </motion.span>
      </motion.button>

      <motion.div
        variants={menuVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="absolute inset-0"
      >
        {items.map((item, index) => {
          const { x, y } = getItemPosition(index, items.length);
          return (
            <motion.button
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={item.onClick}
              className="absolute w-10 h-10 bg-white border-2 border-emerald-600 rounded-full flex items-center justify-center shadow-lg"
              style={{
                x,
                y,
              }}
              title={item.label}
            >
              {item.icon}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

// Composant de pull-to-refresh
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 100,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const y = useMotionValue(0);

  const handleDrag = (event: any, info: PanInfo) => {
    if (info.offset.y > 0) {
      setPullDistance(info.offset.y);
      y.set(Math.min(info.offset.y, threshold * 1.5));
    }
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (info.offset.y > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    y.set(0);
  };

  const refreshProgress = Math.min(pullDistance / threshold, 1);

  if (!enableAnimations) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{ y }}
      className={className}
    >
      {/* Indicateur de refresh */}
      <motion.div
        className="flex justify-center py-4"
        animate={{
          opacity: pullDistance > 0 ? 1 : 0,
          height: pullDistance > 0 ? 'auto' : 0,
        }}
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : refreshProgress * 360 }}
          transition={{
            duration: isRefreshing ? 1 : 0,
            repeat: isRefreshing ? Infinity : 0,
            ease: 'linear',
          }}
          className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full"
        />
      </motion.div>
      
      {children}
    </motion.div>
  );
};

// Composant de long press
interface LongPressProps {
  children: React.ReactNode;
  onLongPress: () => void;
  delay?: number;
  className?: string;
}

export const LongPress: React.FC<LongPressProps> = ({
  children,
  onLongPress,
  delay = 500,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePressStart = () => {
    setIsPressed(true);
    setProgress(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / delay, 1);
      setProgress(newProgress);

      if (newProgress >= 1) {
        clearInterval(interval);
        onLongPress();
        setIsPressed(false);
        setProgress(0);
      }
    }, 16);

    const cleanup = () => {
      clearInterval(interval);
      setIsPressed(false);
      setProgress(0);
    };

    const handleMouseUp = () => {
      cleanup();
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
  };

  if (!enableAnimations) {
    return (
      <div
        onMouseDown={handlePressStart}
        onTouchStart={handlePressStart}
        className={className}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      onMouseDown={handlePressStart}
      onTouchStart={handlePressStart}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      
      {isPressed && (
        <motion.div
          className="absolute inset-0 bg-emerald-600 bg-opacity-20"
          initial={{ scale: 0 }}
          animate={{ scale: progress }}
          style={{ borderRadius: '50%' }}
        />
      )}
    </motion.div>
  );
};