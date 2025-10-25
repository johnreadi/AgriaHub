import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAnimation, useAnimationVariants } from './AnimationProvider';
import { buttonHover, buttonPulse, cardHover, formFieldFocus } from './AnimationVariants';

// Bouton animé avec différents styles
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  animation?: 'hover' | 'pulse' | 'bounce' | 'glow';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  animation = 'hover',
  disabled = false,
  loading = false,
  className = '',
}) => {
  const { getVariants } = useAnimationVariants();

  const getAnimationVariants = () => {
    switch (animation) {
      case 'pulse':
        return getVariants(buttonPulse);
      case 'bounce':
        return getVariants({
          rest: { scale: 1 },
          hover: { scale: 1.1, transition: { type: 'spring', stiffness: 400, damping: 10 } },
          tap: { scale: 0.9 },
        });
      case 'glow':
        return getVariants({
          rest: { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
          hover: { 
            boxShadow: '0 0 20px 5px rgba(59, 130, 246, 0.3)',
            transition: { duration: 0.3 }
          },
        });
      default:
        return getVariants(buttonHover);
    }
  };

  const baseClasses = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white',
    ghost: 'text-emerald-600 hover:bg-emerald-50',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      initial="rest"
      whileHover={!disabled && !loading ? "hover" : "rest"}
      whileTap={!disabled && !loading ? "tap" : "rest"}
      variants={getAnimationVariants()}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden rounded-lg font-medium transition-colors duration-200
        ${baseClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
        </motion.div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </motion.button>
  );
};

// Carte animée avec effet hover
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'tilt' | 'glow' | 'scale';
  clickable?: boolean;
  onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  hoverEffect = 'lift',
  clickable = false,
  onClick,
}) => {
  const { getVariants } = useAnimationVariants();
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  const getHoverVariants = () => {
    switch (hoverEffect) {
      case 'tilt':
        return {};
      case 'glow':
        return getVariants({
          rest: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
          hover: { 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 0 30px rgba(16, 185, 129, 0.2)',
            transition: { duration: 0.3 }
          },
        });
      case 'scale':
        return getVariants({
          rest: { scale: 1 },
          hover: { scale: 1.03, transition: { duration: 0.3 } },
        });
      default:
        return getVariants(cardHover);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hoverEffect !== 'tilt') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((event.clientX - centerX) / 5);
    y.set((event.clientY - centerY) / 5);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverEffect === 'tilt') {
      x.set(0);
      y.set(0);
    }
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={getHoverVariants()}
      style={hoverEffect === 'tilt' ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : {}}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={clickable ? onClick : undefined}
      className={`
        bg-white rounded-xl shadow-lg overflow-hidden
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

// Input animé avec focus
interface AnimatedInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  error?: string;
  className?: string;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  error,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { getVariants } = useAnimationVariants();

  const variants = getVariants(formFieldFocus);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <motion.label
          initial={{ opacity: 0.7 }}
          animate={{ 
            opacity: isFocused || value ? 1 : 0.7,
            scale: isFocused || value ? 0.9 : 1,
            y: isFocused || value ? -10 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="absolute left-3 top-3 text-gray-600 pointer-events-none origin-left"
        >
          {label}
        </motion.label>
      )}
      
      <motion.input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        initial="rest"
        animate={isFocused ? "focus" : "rest"}
        variants={variants}
        className={`
          w-full px-3 py-3 border rounded-lg transition-colors duration-200
          ${label ? 'pt-6' : ''}
          ${error ? 'border-red-500' : 'border-gray-300'}
          focus:outline-none focus:ring-0
        `}
      />
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

// Badge animé
interface AnimatedBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
  pulse?: boolean;
  className?: string;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  variant = 'info',
  pulse = false,
  className = '',
}) => {
  const { getVariants } = useAnimationVariants();

  const variants = getVariants({
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 500, damping: 30 }
    },
  });

  const pulseVariants = getVariants({
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity }
    }
  });

  const variantClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <motion.span
      initial="initial"
      animate={pulse ? "pulse" : "animate"}
      variants={pulse ? pulseVariants : variants}
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </motion.span>
  );
};

// Tooltip animé
interface AnimatedTooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({
  children,
  content,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { getVariants } = useAnimationVariants();

  const variants = getVariants({
    hidden: { opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.2 }
    },
  });

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          className={`
            absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg
            whitespace-nowrap pointer-events-none
            ${positionClasses[position]}
          `}
        >
          {content}
          <div className={`
            absolute w-2 h-2 bg-gray-900 transform rotate-45
            ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' : ''}
            ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' : ''}
            ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : ''}
            ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 -mr-1' : ''}
          `} />
        </motion.div>
      )}
    </div>
  );
};

// Progress bar animée
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  className = '',
  showValue = false,
  color = 'primary',
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const { getVariants } = useAnimationVariants();

  const colorClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  return (
    <div className={`relative ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorClasses[color]}`}
        />
      </div>
      
      {showValue && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute right-0 top-0 -mt-6 text-sm font-medium text-gray-700"
        >
          {Math.round(percentage)}%
        </motion.span>
      )}
    </div>
  );
};