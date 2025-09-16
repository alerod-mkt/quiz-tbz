import { Check } from "lucide-react";
import { memo, useMemo, useEffect, useState } from "react";

interface QuizOptionProps {
  option: string;
  isSelected: boolean;
  onClick: () => void;
  delay?: number;
}

const QuizOption = memo<QuizOptionProps>(({ option, isSelected, onClick, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Use CSS animation with staggered delays for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay * 100); // Reduced from 1000 to 100 for faster animation
    
    return () => clearTimeout(timer);
  }, [delay]);

  const checkboxClassName = useMemo(() => 
    `w-5 sm:w-6 h-5 sm:h-6 border-2 border-primary rounded-full mr-3 sm:mr-4 flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${
      isSelected ? 'bg-primary' : ''
    }`, [isSelected]);

  const containerClassName = useMemo(() => 
    `quiz-option bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow-md cursor-pointer transition-all duration-200
    hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center
    ${isSelected ? 'border-primary border-2' : 'border border-gray-200'} 
    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`, [isSelected, isVisible]);

  return (
    <div
      className={containerClassName}
      onClick={onClick}
      data-testid="quiz-option"
      style={{ 
        transitionDelay: isVisible ? '0ms' : `${delay * 50}ms`, // Faster stagger
        transitionDuration: '300ms', // Shorter transition
        transitionProperty: 'opacity, transform'
      }}
    >
      <div className="flex items-center w-full">
        <div className={checkboxClassName}>
          {isSelected && <Check className="w-3 sm:w-4 h-3 sm:h-4 text-white" />}
        </div>
        <span className="text-sm sm:text-base text-foreground font-medium leading-relaxed">{option}</span>
      </div>
    </div>
  );
});

QuizOption.displayName = 'QuizOption';

export default QuizOption;
