import React from 'react';
import { motion } from 'framer-motion';
import { useAnimation } from './AnimationProvider';

// Spinner de base
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const { enableAnimations } = useAnimation();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'border-emerald-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
  };

  if (!enableAnimations) {
    return (
      <div className={`${sizeClasses[size]} border-2 rounded-full ${colorClasses[color]} ${className}`} />
    );
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={`${sizeClasses[size]} border-2 rounded-full ${colorClasses[color]} ${className}`}
    />
  );
};

// Dots loader
interface DotsLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export const DotsLoader: React.FC<DotsLoaderProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const { enableAnimations } = useAnimation();

  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colorClasses = {
    primary: 'bg-emerald-600',
    white: 'bg-white',
    gray: 'bg-gray-600',
  };

  const dotVariants = {
    initial: { scale: 0.8, opacity: 0.5 },
    animate: { scale: 1.2, opacity: 1 },
  };

  if (!enableAnimations) {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.2,
          }}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
        />
      ))}
    </div>
  );
};

// Pulse loader
interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const { enableAnimations } = useAnimation();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'bg-emerald-600',
    white: 'bg-white',
    gray: 'bg-gray-600',
  };

  if (!enableAnimations) {
    return (
      <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full ${className}`} />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
      />
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.2,
        }}
        className={`absolute inset-0 ${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
      />
    </div>
  );
};

// Wave loader
interface WaveLoaderProps {
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

export const WaveLoader: React.FC<WaveLoaderProps> = ({
  className = '',
  color = 'primary',
}) => {
  const { enableAnimations } = useAnimation();

  const colorClasses = {
    primary: 'bg-emerald-600',
    white: 'bg-white',
    gray: 'bg-gray-600',
  };

  if (!enableAnimations) {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-1 h-8 ${colorClasses[color]} rounded-full`} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex space-x-1 items-end ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          animate={{
            scaleY: [1, 2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
          className={`w-1 h-4 ${colorClasses[color]} rounded-full origin-bottom`}
        />
      ))}
    </div>
  );
};

// Skeleton loader
interface SkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  lines = 3,
  avatar = false,
  width = 'w-full',
  height = 'h-4',
}) => {
  const { enableAnimations } = useAnimation();

  const pulseAnimation = enableAnimations ? {
    animate: {
      opacity: [0.5, 1, 0.5],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  } : {};

  return (
    <div className={`animate-pulse ${className}`}>
      {avatar && (
        <motion.div
          {...pulseAnimation}
          className="w-12 h-12 bg-gray-300 rounded-full mb-4"
        />
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            {...pulseAnimation}
            style={{ animationDelay: `${i * 0.1}s` }}
            className={`${height} bg-gray-300 rounded ${
              i === lines - 1 ? 'w-3/4' : width
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <Skeleton avatar lines={3} />
    </div>
  );
};

// Loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  loader?: 'spinner' | 'dots' | 'pulse' | 'wave';
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  loader = 'spinner',
  message = 'Chargement...',
  className = '',
}) => {
  const { enableAnimations } = useAnimation();

  const getLoader = () => {
    switch (loader) {
      case 'dots':
        return <DotsLoader size="lg" />;
      case 'pulse':
        return <PulseLoader size="lg" />;
      case 'wave':
        return <WaveLoader />;
      default:
        return <Spinner size="xl" />;
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <div className={`relative ${className}`}>
      {children}
      
      {isLoading && (
        <motion.div
          initial={enableAnimations ? "hidden" : "visible"}
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-50 rounded-lg"
        >
          {getLoader()}
          {message && (
            <motion.p
              initial={enableAnimations ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-gray-600 font-medium"
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Progress loader avec étapes
interface ProgressLoaderProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
  steps,
  currentStep,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Étape {currentStep + 1} sur {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: enableAnimations ? 0.5 : 0, ease: 'easeOut' }}
            className="bg-emerald-600 h-2 rounded-full"
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={enableAnimations ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
            animate={{
              opacity: index <= currentStep ? 1 : 0.5,
              x: 0,
            }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center space-x-3 ${
              index <= currentStep ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${index < currentStep 
                ? 'bg-emerald-600 text-white' 
                : index === currentStep 
                ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-600' 
                : 'bg-gray-200 text-gray-400'
              }
            `}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className="font-medium">{step}</span>
            {index === currentStep && (
              <DotsLoader size="sm" color="primary" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Loader de contenu avec shimmer effect
interface ContentLoaderProps {
  type: 'text' | 'card' | 'list' | 'image';
  count?: number;
  className?: string;
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({
  type,
  count = 1,
  className = '',
}) => {
  const { enableAnimations } = useAnimation();

  const shimmerVariants = {
    animate: {
      x: ['-100%', '100%'],
    },
  };

  const ShimmerEffect = ({ children }: { children: React.ReactNode }) => (
    <div className="relative overflow-hidden">
      {children}
      {enableAnimations && (
        <motion.div
          variants={shimmerVariants}
          animate="animate"
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-transparent opacity-30"
        />
      )}
    </div>
  );

  const renderLoader = () => {
    switch (type) {
      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <ShimmerEffect key={i}>
                <div className="h-4 bg-gray-300 rounded w-full" />
              </ShimmerEffect>
            ))}
          </div>
        );
      
      case 'card':
        return (
          <div className="grid gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <ShimmerEffect>
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-300 rounded w-3/4" />
                    <div className="h-4 bg-gray-300 rounded w-full" />
                    <div className="h-4 bg-gray-300 rounded w-5/6" />
                  </div>
                </ShimmerEffect>
              </div>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <ShimmerEffect>
                  <div className="w-10 h-10 bg-gray-300 rounded-full" />
                </ShimmerEffect>
                <div className="flex-1 space-y-2">
                  <ShimmerEffect>
                    <div className="h-4 bg-gray-300 rounded w-3/4" />
                  </ShimmerEffect>
                  <ShimmerEffect>
                    <div className="h-3 bg-gray-300 rounded w-1/2" />
                  </ShimmerEffect>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'image':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <ShimmerEffect key={i}>
                <div className="aspect-square bg-gray-300 rounded-lg" />
              </ShimmerEffect>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return <div className={className}>{renderLoader()}</div>;
};