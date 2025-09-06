import { motion } from "framer-motion";

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  isVisible: boolean;
}

export default function QuizProgress({ currentQuestion, totalQuestions, isVisible }: QuizProgressProps) {
  // Progresso não linear estilo VSL - avança mais rápido no início
  const calculateVSLProgress = (current: number, total: number): number => {
    if (current === 0) return 0;
    
    const progress = current / total;
    
    // Curva que avança mais rápido no início e mais devagar no final
    // Usa uma função logarítmica invertida
    const vslProgress = Math.pow(progress, 0.6) * 100;
    
    return Math.min(vslProgress, 100);
  };

  const percentage = calculateVSLProgress(currentQuestion, totalQuestions);

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm"
      data-testid="progress-container"
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Progresso do Diagnóstico
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <motion.div 
            className="progress-bar h-2 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            data-testid="progress-bar"
          />
        </div>
      </div>
    </motion.div>
  );
}
