import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface AnimationMetrics {
  fps: number;
  frameDrops: number;
  memoryUsage: number;
  animationCount: number;
  lastUpdate: number;
}

interface AnimationMonitorProps {
  enabled?: boolean;
  onPerformanceIssue?: (metrics: AnimationMetrics) => void;
}

// Hook pour monitorer les performances des animations
export const useAnimationMonitor = (enabled = false) => {
  const [metrics, setMetrics] = useState<AnimationMetrics>({
    fps: 60,
    frameDrops: 0,
    memoryUsage: 0,
    animationCount: 0,
    lastUpdate: Date.now()
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    if (!enabled || isMonitoring) return;

    setIsMonitoring(true);
    let frameCount = 0;
    let lastTime = performance.now();
    let frameDropCount = 0;
    let animationFrameId: number;

    const measurePerformance = (currentTime: number) => {
      frameCount++;
      const deltaTime = currentTime - lastTime;

      // Calculer les FPS toutes les secondes
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime);
        
        // Détecter les drops de frames (FPS < 30)
        if (fps < 30) {
          frameDropCount++;
        }

        // Obtenir l'utilisation mémoire si disponible
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;

        // Compter les animations actives
        const animationCount = document.querySelectorAll('[data-framer-motion]').length;

        const newMetrics: AnimationMetrics = {
          fps,
          frameDrops: frameDropCount,
          memoryUsage,
          animationCount,
          lastUpdate: Date.now()
        };

        setMetrics(newMetrics);

        // Reset pour la prochaine mesure
        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measurePerformance);
    };

    animationFrameId = requestAnimationFrame(measurePerformance);

    return () => {
      setIsMonitoring(false);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enabled]); // Only depend on enabled, not isMonitoring to prevent infinite loop

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [enabled]); // Removed startMonitoring from dependencies to prevent infinite loop

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
};

// Composant de monitoring visuel (pour le développement)
const AnimationMonitor: React.FC<AnimationMonitorProps> = ({ 
  enabled = false, 
  onPerformanceIssue 
}) => {
  const { metrics, isMonitoring } = useAnimationMonitor(enabled);
  const [showMonitor, setShowMonitor] = useState(false);

  useEffect(() => {
    // Déclencher l'alerte en cas de problème de performance
    if (onPerformanceIssue && (metrics.fps < 30 || metrics.frameDrops > 5)) {
      onPerformanceIssue(metrics);
    }
  }, [metrics, onPerformanceIssue]);

  // Afficher le moniteur seulement en mode développement
  useEffect(() => {
    setShowMonitor(process.env.NODE_ENV === 'development' && enabled);
  }, [enabled]);

  if (!showMonitor || !isMonitoring) return null;

  const getPerformanceColor = (fps: number) => {
    if (fps >= 50) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono"
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <div className="space-y-1">
        <div className={`flex justify-between ${getPerformanceColor(metrics.fps)}`}>
          <span>FPS:</span>
          <span>{metrics.fps}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Frame Drops:</span>
          <span>{metrics.frameDrops}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Memory:</span>
          <span>{metrics.memoryUsage.toFixed(1)}MB</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Animations:</span>
          <span>{metrics.animationCount}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Hook pour optimiser automatiquement les animations selon les performances
export const useAdaptiveAnimations = () => {
  const { metrics } = useAnimationMonitor(true);
  const [animationQuality, setAnimationQuality] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    // Ajuster la qualité des animations selon les performances
    if (metrics.fps < 20 || metrics.frameDrops > 10) {
      setAnimationQuality('low');
    } else if (metrics.fps < 40 || metrics.frameDrops > 5) {
      setAnimationQuality('medium');
    } else if (metrics.fps >= 50 && metrics.frameDrops < 2) {
      setAnimationQuality('high');
    }
  }, [metrics]);

  const getAdaptiveVariants = useCallback((baseVariants: any) => {
    switch (animationQuality) {
      case 'low':
        return {
          ...baseVariants,
          transition: {
            duration: 0.1,
            ease: 'linear'
          }
        };
      case 'medium':
        return {
          ...baseVariants,
          transition: {
            ...baseVariants.transition,
            duration: (baseVariants.transition?.duration || 0.3) * 0.7,
            ease: 'easeOut'
          }
        };
      default:
        return baseVariants;
    }
  }, [animationQuality]);

  return {
    animationQuality,
    getAdaptiveVariants,
    metrics
  };
};

// Composant pour déboguer les animations
export const AnimationDebugger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Activer/désactiver le mode debug avec Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (debugMode) {
      // Ajouter des styles de debug
      const style = document.createElement('style');
      style.id = 'animation-debugger';
      style.textContent = `
        [data-framer-motion] {
          outline: 2px solid rgba(255, 0, 0, 0.5) !important;
          outline-offset: 2px;
        }
        
        [data-framer-motion]:hover {
          outline-color: rgba(0, 255, 0, 0.8) !important;
        }
        
        .motion-debug-info {
          position: absolute;
          top: -20px;
          left: 0;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 3px;
          pointer-events: none;
          z-index: 9999;
        }
      `;
      
      document.head.appendChild(style);
      
      return () => {
        const existingStyle = document.getElementById('animation-debugger');
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }
  }, [debugMode]);

  return (
    <>
      {children}
      {debugMode && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs">
          Animation Debug Mode Active (Ctrl+Shift+D to toggle)
        </div>
      )}
    </>
  );
};

export default AnimationMonitor;