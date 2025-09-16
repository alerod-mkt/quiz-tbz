import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { memo, useMemo } from "react";

interface QuizOptionProps {
  option: string;
  isSelected: boolean;
  onClick: () => void;
  delay?: number;
}

const QuizOption = memo<QuizOptionProps>(({ option, isSelected, onClick, delay = 0 }) => {
  // Memoize computed values to avoid recalculation
  const animationConfig = useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay }
  }), [delay]);

  const checkboxClassName = useMemo(() => 
    `w-6 h-6 border-2 border-primary rounded-full mr-4 flex-shrink-0 flex items-center justify-center ${
      isSelected ? 'bg-primary' : ''
    }`, [isSelected]);

  const containerClassName = useMemo(() => 
    `quiz-option bg-white p-6 rounded-lg shadow-md cursor-pointer ${
      isSelected ? 'border-primary' : ''
    }`, [isSelected]);
  return (
    <motion.div
      {...animationConfig}
      className={containerClassName}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      data-testid="quiz-option"
    >
      <div className="flex items-center">
        <div className={checkboxClassName}>
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>
        <span className="text-foreground font-medium">{option}</span>
      </div>
    </motion.div>
  );
});

QuizOption.displayName = 'QuizOption';

export default QuizOption;
