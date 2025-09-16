import { motion } from "framer-motion";
import { useState } from "react";
import QuizOption from "@/components/QuizOption";
import { Question, QuizAnswer } from "@/types/quiz";
import { 
  Users, 
  Calendar, 
  BarChart, 
  HeartCrack, 
  Frown, 
  HandHeart, 
  MessageSquareX, 
  TrendingDown, 
  Shield, 
  Eye, 
  Clock, 
  Moon, 
  Heart, 
  RotateCcw, 
  Gem 
} from "lucide-react";

interface QuizQuestionProps {
  question: Question;
  onAnswer: (answer: QuizAnswer) => void;
  selectedAnswer?: QuizAnswer;
}

export default function QuizQuestion({ question, onAnswer, selectedAnswer }: QuizQuestionProps) {
  const [localSelected, setLocalSelected] = useState<QuizAnswer | undefined>(selectedAnswer);

  const handleOptionClick = (answer: QuizAnswer) => {
    setLocalSelected(answer);
    
    // Auto-advance after short delay
    setTimeout(() => {
      onAnswer(answer);
    }, 800);
  };

  // Função para retornar o ícone temático baseado no ID da pergunta
  const getQuestionIcon = (questionId: number) => {
    const iconProps = { size: 32, className: "text-primary mb-3 sm:mb-4 w-8 h-8 sm:w-12 sm:h-12" };
    
    switch (questionId) {
      case 1: return <Users {...iconProps} />; // Filhos presenciando brigas
      case 2: return <Calendar {...iconProps} />; // Idade dos filhos
      case 3: return <BarChart {...iconProps} />; // Frequência de discussões
      case 4: return <HeartCrack {...iconProps} />; // Filhos implorando para parar
      case 5: return <Frown {...iconProps} />; // Sentimento de prejudicar
      case 6: return <HandHeart {...iconProps} />; // O que mais desespera
      case 7: return <MessageSquareX {...iconProps} />; // Reação do marido
      case 8: return <TrendingDown {...iconProps} />; // Mudanças nos filhos
      case 9: return <Shield {...iconProps} />; // Medo de traumatizar
      case 10: return <Eye {...iconProps} />; // Casal harmonioso
      case 11: return <Clock {...iconProps} />; // Medo do futuro
      case 12: return <Moon {...iconProps} />; // Pesadelos
      case 13: return <Heart {...iconProps} />; // Fazer qualquer coisa
      case 14: return <RotateCcw {...iconProps} />; // Voltar no tempo
      case 15: return <Gem {...iconProps} />; // Valor do futuro
      default: return <Heart {...iconProps} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-20">
      <div className="max-w-3xl w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="maternal-warmth rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl fade-in"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 sm:mb-8"
          >
            {/* Elemento gráfico temático */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center mb-4 sm:mb-6"
            >
              {getQuestionIcon(question.id)}
            </motion.div>
            
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-3 sm:mb-4 leading-tight px-2 sm:px-0" data-testid="question-text">
              {question.question}
            </h2>
          </motion.div>
          
          <div className="space-y-3 sm:space-y-4" data-testid="question-options">
            {Object.entries(question.options).map(([key, option], index) => (
              <QuizOption
                key={key}
                option={option}
                isSelected={localSelected === key}
                onClick={() => handleOptionClick(key as QuizAnswer)}
                delay={index * 0.1}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
