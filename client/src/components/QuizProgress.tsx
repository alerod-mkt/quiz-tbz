import { memo, useMemo, useEffect, useState } from "react";

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  isVisible: boolean;
}

// Memoize the progress calculation function to avoid recreation
const calculateVSLProgress = (current: number, total: number): number => {
  if (current === 0) return 0;
  
  const progress = current / total;
  
  // Curva que avança mais rápido no início e mais devagar no final
  // Usa uma função logarítmica invertida
  const vslProgress = Math.pow(progress, 0.6) * 100;
  
  return Math.min(vslProgress, 100);
};

const QuizProgress = memo<QuizProgressProps>(({ currentQuestion, totalQuestions, isVisible }) => {
  const [mounted, setMounted] = useState(false);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  
  // Memoize expensive calculation
  const percentage = useMemo(
    () => calculateVSLProgress(currentQuestion, totalQuestions),
    [currentQuestion, totalQuestions]
  );

  // Handle mounting animation with CSS
  useEffect(() => {
    if (isVisible) {
      setMounted(true);
    }
  }, [isVisible]);

  // Animate progress bar width change
  useEffect(() => {
    if (mounted) {
      // Use RAF for smooth animation
      const timer = setTimeout(() => {
        setAnimatedWidth(percentage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [percentage, mounted]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed top-0 left-0 w-full z-50 bg-white shadow-sm transition-all duration-300 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
      }`}
      data-testid="progress-container"
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-center mb-1 sm:mb-2">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            Progresso do Diagnóstico
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5 sm:h-2">
          <div 
            className="progress-bar h-1.5 sm:h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${animatedWidth}%` }}
            data-testid="progress-bar"
          />
        </div>
      </div>
    </div>
  );
});

QuizProgress.displayName = 'QuizProgress';

export default QuizProgress;
