import React, { useState, useEffect, useCallback } from 'react';
import { QuizState, EventType } from './types';
import { quizQuestions } from './constants/quizData';
import WelcomeScreen from './components/WelcomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import LeadCaptureScreen from './components/LeadCaptureScreen';
import DashboardScreen from './components/DashboardScreen';
import SimpleAuthScreen from './components/SimpleAuthScreen';
import * as api from './api';

const App: React.FC = () => {
  const [view, setView] = useState<QuizState>(QuizState.WELCOME);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisLevel, setDiagnosisLevel] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentStep = useCallback(() => {
    switch (view) {
      case QuizState.WELCOME: return 'pagina_inicial';
      case QuizState.QUIZ: return `pergunta_${currentQuestionIndex + 1}`;
      case QuizState.LEAD_CAPTURE: return 'cadastro_lead';
      case QuizState.RESULTS: return 'quiz_completo';
      default: return 'unknown';
    }
  }, [view, currentQuestionIndex]);

  useEffect(() => {
    if (!sessionId || view === QuizState.DASHBOARD || view === QuizState.AUTH) return;

    const handleBeforeUnload = () => {
      const currentStep = getCurrentStep();
      if (currentStep !== 'quiz_completo') {
        const abandonmentData = JSON.stringify({
          session_id: sessionId,
          reason: 'fechamento_janela',
          step_where_abandoned: currentStep
        });
        // Usar navigator.sendBeacon para enviar dados de abandono de forma não bloqueante
        navigator.sendBeacon(`https://ynxsksgttbzxooixgqzf.supabase.co/functions/v1/track-abandonment`, abandonmentData);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, view, currentQuestionIndex, getCurrentStep]);

  useEffect(() => {
    const checkRouteAndInitSession = async () => {
      const path = window.location.pathname;
      
      if (path === '/painel') {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        setView(isAuthenticated ? QuizState.DASHBOARD : QuizState.AUTH);
      } else {
        let existingSessionId = sessionStorage.getItem('quiz_session_id');
        const sessionTimestamp = sessionStorage.getItem('quiz_session_timestamp');
        
        if (!existingSessionId || !sessionTimestamp || (Date.now() - parseInt(sessionTimestamp) > 3600000)) {
          existingSessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
          sessionStorage.setItem('quiz_session_id', existingSessionId);
          sessionStorage.setItem('quiz_session_timestamp', Date.now().toString());
        }
        
        setSessionId(existingSessionId);
        setView(QuizState.WELCOME);
      }
      
      setIsLoading(false);
    };

    checkRouteAndInitSession();
    window.addEventListener('popstate', checkRouteAndInitSession);
    return () => window.removeEventListener('popstate', checkRouteAndInitSession);
  }, []);

  const handleLogin = () => setView(QuizState.DASHBOARD);

  const handleAnswer = useCallback(async () => {
    // Não aguarda o trackEvent para não bloquear a UI
    api.trackEvent(EventType.QUESTION_VIEW, { questionId: quizQuestions[currentQuestionIndex].id, sessionId });

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      if (!sessionStorage.getItem('quiz_complete_tracked')) {
        sessionStorage.setItem('quiz_complete_tracked', 'true');
        api.trackEvent(EventType.QUIZ_COMPLETE, { sessionId }); // Não aguarda
      }
      setView(QuizState.LEAD_CAPTURE);
    }
  }, [currentQuestionIndex, sessionId]);

  const handleLeadSubmit = useCallback(async (leadData: { name: string; email: string; phone: string }) => {
    if (!sessionStorage.getItem('lead_submit_tracked')) {
      sessionStorage.setItem('lead_submit_tracked', 'true');
      api.trackEvent(EventType.LEAD_SUBMIT, { ...leadData, sessionId }); // Não aguarda
    }
    
    const cleanPhone = leadData.phone.replace(/\D/g, '');
    const params = new URLSearchParams({
      name: leadData.name,
      email: leadData.email,
      phoneac: cleanPhone.substring(0, 2),
      phonenumber: cleanPhone.substring(2),
    });

    window.history.pushState({}, '', `?${params.toString()}`);
    setIsAnalyzing(true);
    setDiagnosisLevel(Math.floor(Math.random() * 3));
    setTimeout(() => {
      setIsAnalyzing(false);
      setView(QuizState.RESULTS);
    }, 2500);
  }, [sessionId]);

  const handleOfferClick = useCallback(async () => {
    if (!sessionStorage.getItem('offer_click_tracked')) {
      sessionStorage.setItem('offer_click_tracked', 'true');
      api.trackEvent(EventType.OFFER_CLICK, { sessionId }); // Não aguarda
    }
    // Navega imediatamente
    window.location.href = (document.getElementById('hotmart-url') as HTMLInputElement)?.value || 'https://pay.hotmart.com/S101001652G?off=mesaihyj&checkoutMode=10';
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-6"></div>
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Analisando suas respostas...</h2>
        <p className="text-lg text-text-secondary mt-2">Gerando seu diagnóstico personalizado.</p>
      </div>
    );
  }

  switch (view) {
    case QuizState.WELCOME:
      return <WelcomeScreen onStart={() => {
          api.trackEvent(EventType.QUIZ_START, { sessionId }); // Não aguarda
          setView(QuizState.QUIZ);
      }} trackVisit={async () => {
        if (!sessionStorage.getItem('visit_tracked')) {
          sessionStorage.setItem('visit_tracked', 'true');
          api.trackEvent(EventType.VISIT, { sessionId }); // Não aguarda
        }
      }} />;
    case QuizState.QUIZ:
      return <QuizScreen
        questions={quizQuestions}
        currentQuestionIndex={currentQuestionIndex}
        onAnswer={handleAnswer}
        trackQuestionView={async (id) => {
          // A chamada para trackEvent para QUESTION_VIEW já está dentro de handleAnswer
          // para garantir que o evento seja disparado antes da transição da pergunta.
          // Se você quiser rastrear a visualização de cada pergunta separadamente,
          // pode descomentar a linha abaixo, mas certifique-se de que não haja duplicação.
          // api.trackEvent(EventType.QUESTION_VIEW, { questionId: id, sessionId });
        }}
      />;
    case QuizState.LEAD_CAPTURE:
      return <LeadCaptureScreen onSubmit={handleLeadSubmit} />;
    case QuizState.RESULTS:
      return <ResultScreen diagnosisLevel={diagnosisLevel} onOfferClick={handleOfferClick} />;
    case QuizState.AUTH:
      return <SimpleAuthScreen onLogin={handleLogin} />;
    case QuizState.DASHBOARD:
      return <DashboardScreen totalQuestions={quizQuestions.length} />;
    default:
      return <WelcomeScreen onStart={() => setView(QuizState.QUIZ)} trackVisit={() => {}} />;
  }
};

export default App;