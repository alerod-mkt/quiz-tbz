import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useInitializeSession, useTrackVisitor, useTrackConversion, trackQuizCompleted, trackQuizStart, trackQuestionVisitor, trackQuestionConversion, trackVSLVisitAndQuizCompleted, useAbandonoDetection } from "@/hooks/use-metrics";

import QuizProgress from "@/components/QuizProgress";
import LandingPage from "./LandingPage";
import QuizQuestion from "./QuizQuestion";
import VSLPage from "./VSLPage";
import SalesPage from "./SalesPage";

import { QUIZ_QUESTIONS, QuizAnswers, QuizAnswer } from "@/types/quiz";

type Page = 'landing' | 'quiz' | 'vsl' | 'sales';


export default function QuizFlow() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  const { toast } = useToast();

  // Inicializar sessão e rastreamento (isso já rastreia a landing page)
  useInitializeSession();
  
  // Detectar abandono por inatividade ou fechamento de página
  useAbandonoDetection(currentPage);
  
  // Rastreamento removido - agora feito diretamente nos cliques dos botões
  
  // Rastrear apenas quiz completado quando chegar na página de vendas
  useEffect(() => {
    const trackSpecialPages = async () => {
      console.log('🔍 trackSpecialPages executado:', { currentPage, quizAnswersCount: Object.keys(quizAnswers).length });
      
      if (currentPage === 'sales') {
        // Marca quiz como completado quando chega nas vendas
        const emotionalScore = calculateEmotionalScore(quizAnswers);
        console.log('🎯 Chegou na página de vendas! Score calculado:', emotionalScore);
        await trackQuizCompleted(emotionalScore);
        console.log('✅ Quiz completado registrado na chegada à página de vendas');
      }
    };
    
    trackSpecialPages();
  }, [currentPage, quizAnswers]);
  
  // Rastrear visitante em cada pergunta do quiz (REMOVIDO - agora é feito automaticamente)
  // A primeira pergunta é rastreada no trackQuizStart
  // As demais são rastreadas no trackQuestionConversion

  // Calculate emotional score based on answers
  const calculateEmotionalScore = (answers: QuizAnswers): string => {
    const totalAnswers = Object.keys(answers).length;
    const aAnswers = Object.values(answers).filter(answer => answer === 'A').length;
    
    if (aAnswers >= totalAnswers * 0.7) return 'HIGH_URGENCY';
    if (aAnswers >= totalAnswers * 0.4) return 'MEDIUM_URGENCY';
    return 'LOW_URGENCY';
  };


  const handleStartQuiz = async () => {
    console.log('🎯 handleStartQuiz: iniciando quiz e rastreamento');
    
    // Marcar conversão da landing e visita no quiz_inicio
    await apiRequest('POST', '/api/metrics/conversion', { etapaOrigem: 'landing', etapaDestino: 'quiz_inicio' });
    await apiRequest('POST', '/api/metrics/visitor', { etapa: 'quiz_inicio' });
    console.log('✅ Conversão landing->quiz_inicio e visita quiz_inicio registradas');
    
    setCurrentPage('quiz');
  };

  const handleQuizAnswer = async (answer: QuizAnswer) => {
    const currentQuestionNumber = currentQuestionIndex + 1; // Pergunta atual (1-15)
    
    console.log(`🎯 handleQuizAnswer: pergunta ${currentQuestionNumber}, resposta: ${answer}`);
    console.log(`🔍 DEBUG: currentQuestionIndex=${currentQuestionIndex}, QUIZ_QUESTIONS.length=${QUIZ_QUESTIONS.length}`);
    console.log(`🔍 DEBUG: Condição (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) = ${currentQuestionIndex < QUIZ_QUESTIONS.length - 1}`);
    
    // Salvar resposta
    const newAnswers = {
      ...quizAnswers,
      [QUIZ_QUESTIONS[currentQuestionIndex].id]: answer
    };
    setQuizAnswers(newAnswers);

    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      // Rastrear conversão da pergunta atual e visita da próxima pergunta
      const etapaOrigem = currentQuestionNumber === 1 ? 'quiz_inicio' : `quiz_pergunta_${currentQuestionNumber}`;
      const etapaDestino = `quiz_pergunta_${currentQuestionNumber + 1}`;
      
      console.log(`🔄 Avançando para próxima pergunta: ${etapaOrigem} -> ${etapaDestino}`);
      
      await apiRequest('POST', '/api/metrics/conversion', { etapaOrigem, etapaDestino });
      await apiRequest('POST', '/api/metrics/visitor', { etapa: etapaDestino });
      console.log(`✅ Conversão ${etapaOrigem} -> ${etapaDestino} e visita ${etapaDestino} registradas`);
      
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Última pergunta - rastrear conversão para VSL e visita VSL
      const etapaOrigem = `quiz_pergunta_${currentQuestionNumber}`;
      
      console.log(`🏁 ÚLTIMA PERGUNTA! Transitioning para VSL: ${etapaOrigem} -> vsl`);
      
      try {
        await apiRequest('POST', '/api/metrics/conversion', { etapaOrigem, etapaDestino: 'vsl' });
        await apiRequest('POST', '/api/metrics/visitor', { etapa: 'vsl' });
        console.log(`✅ Conversão ${etapaOrigem} -> vsl e visita VSL registradas`);
        
        console.log(`🎬 Chamando setCurrentPage('vsl')...`);
        setCurrentPage('vsl');
        console.log(`🎬 setCurrentPage('vsl') chamado com sucesso!`);
      } catch (error) {
        console.error('❌ Erro ao transitar para VSL:', error);
        // Mesmo com erro no tracking, navegar para VSL
        setCurrentPage('vsl');
      }
    }
  };

  const handleVSLContinue = async () => {
    // Rastrear conversão VSL -> Sales e visita Sales
    console.log('🎯 handleVSLContinue: rastreando conversão VSL -> Sales');
    await apiRequest('POST', '/api/metrics/conversion', { etapaOrigem: 'vsl', etapaDestino: 'sales' });
    await apiRequest('POST', '/api/metrics/visitor', { etapa: 'sales' });
    console.log('✅ Conversão VSL->Sales e visita Sales registradas');
    setCurrentPage('sales');
  };

  // Função de checkout removida conforme solicitado

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, currentQuestionIndex]);

  const isQuizPage = currentPage === 'quiz';
  const progressVisible = isQuizPage;
  const currentQuestion = isQuizPage ? currentQuestionIndex + 1 : 0;

  return (
    <div className="min-h-screen">
      <QuizProgress 
        currentQuestion={currentQuestion}
        totalQuestions={QUIZ_QUESTIONS.length}
        isVisible={progressVisible}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentPage}-${currentQuestionIndex}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
        >
          {currentPage === 'landing' && (
            <LandingPage onStart={handleStartQuiz} />
          )}

          {currentPage === 'quiz' && (
            <QuizQuestion
              question={QUIZ_QUESTIONS[currentQuestionIndex]}
              onAnswer={handleQuizAnswer}
              selectedAnswer={quizAnswers[QUIZ_QUESTIONS[currentQuestionIndex].id]}
            />
          )}


          {currentPage === 'vsl' && (
            <VSLPage onContinue={handleVSLContinue} />
          )}

          {currentPage === 'sales' && (
            <SalesPage 
              quizAnswers={quizAnswers}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
