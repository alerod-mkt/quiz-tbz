import { useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';

let sessionId: number | null = null;
let sessionInitialized = false;

// Fila de ações para executar após inicialização da sessão
let actionQueue: (() => Promise<void>)[] = [];

// Executar ações enfileiradas
const executeQueuedActions = async () => {
  while (actionQueue.length > 0) {
    const action = actionQueue.shift();
    if (action) {
      await action();
      // Pequeno delay entre ações para evitar conflitos
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

// Inicializar sessão quando o usuário chega
export const useInitializeSession = () => {
  const initialized = useRef(false);

  useEffect(() => {
    const initSession = async () => {
      if (!initialized.current) {
        try {
          console.log('🚀 Iniciando sessão...');
          const response = await apiRequest('POST', '/api/metrics/session') as unknown as { sessionId: number };
          sessionId = response.sessionId;
          sessionInitialized = true;
          console.log('✅ Sessão inicializada:', { sessionId });
          
          // Registrar visita na landing page
          await apiRequest('POST', '/api/metrics/visitor', { etapa: 'landing' });
          console.log('✅ Visita na landing page rastreada');
          
          // Executar ações enfileiradas
          await executeQueuedActions();
        } catch (error) {
          console.error('❌ Erro ao inicializar sessão:', error);
          sessionId = null;
          sessionInitialized = false;
          // Tentar novamente em 2 segundos
          setTimeout(() => {
            initialized.current = false;
            initSession();
          }, 2000);
        }
        initialized.current = true;
      }
    };

    initSession();
  }, []);

  return sessionId;
};

// Hook para rastrear visitantes em cada etapa
export const useTrackVisitor = (etapa: string) => {
  const tracked = useRef(false);

  useEffect(() => {
    const trackVisitor = async () => {
      if (!tracked.current) {
        try {
          console.log(`📍 useTrackVisitor: ${etapa}`);
          await apiRequest('POST', '/api/metrics/visitor', { etapa });
          console.log(`✅ Visitante ${etapa} rastreado`);
        } catch (error) {
          console.error(`❌ Erro ao rastrear visitante na etapa ${etapa}:`, error);
        }
        tracked.current = true;
      }
    };

    trackVisitor();
  }, [etapa]);
};

// Função para rastrear visita VSL com quiz completado (REMOVIDA - agora separado)
// A visita VSL é registrada no useEffect do QuizFlow
// O quiz completed é marcado apenas quando chegar na página de vendas
export const trackVSLVisitAndQuizCompleted = async (urgencia: string) => {
  console.log('🎬 trackVSLVisitAndQuizCompleted chamado (sem ação - lógica movida):', { urgencia });
  // Não faz nada - a lógica foi movida para o useEffect do QuizFlow
};

// Hook para rastrear conversões entre etapas (com visitante no destino)
export const useTrackConversion = (etapaOrigem: string, etapaDestino: string, trigger: boolean) => {
  const previousTrigger = useRef(false);
  
  useEffect(() => {
    if (trigger && !previousTrigger.current) {
      const trackConversion = async () => {
        try {
          console.log(`🎯 useTrackConversion: ${etapaOrigem} -> ${etapaDestino}`);
          
          // Primeiro registra conversão na origem
          await apiRequest('POST', '/api/metrics/conversion', { etapaOrigem, etapaDestino });
          console.log(`✅ Conversão ${etapaOrigem} -> ${etapaDestino} rastreada`);
          
          // Depois registra visitante no destino
          await new Promise(resolve => setTimeout(resolve, 100));
          await apiRequest('POST', '/api/metrics/visitor', { etapa: etapaDestino });
          console.log(`✅ Visitante ${etapaDestino} rastreado`);
        } catch (error) {
          console.error(`❌ Erro ao rastrear conversão ${etapaOrigem} -> ${etapaDestino}:`, error);
        }
      };

      trackConversion();
    }
    previousTrigger.current = trigger;
  }, [trigger, etapaOrigem, etapaDestino]);
};

// Função para rastrear quiz completado
export const trackQuizCompleted = async (urgencia: string) => {
  console.log('🎯 trackQuizCompleted chamado:', { sessionId, urgencia, sessionInitialized });
  
  const executeTrack = async () => {
    if (sessionId) {
      try {
        await apiRequest('POST', '/api/metrics/quiz-completed', { sessionId, urgencia });
        console.log('✅ Quiz completado rastreado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao rastrear quiz completado:', error);
      }
    } else {
      console.warn('⚠️ SessionId não disponível para trackQuizCompleted');
    }
  };
  
  if (sessionInitialized) {
    await executeTrack();
  } else {
    console.log('📝 Enfileirando trackQuizCompleted até sessão estar pronta');
    actionQueue.push(executeTrack);
  }
};

// Função para rastrear início do checkout
export const trackCheckoutStarted = async () => {
  console.log('🛒 trackCheckoutStarted chamado - fazendo chamada direta');
  
  try {
    // Registra APENAS o checkout iniciado (sem vínculo com sales)
    await apiRequest('POST', '/api/metrics/checkout-started', {});
    console.log('✅ Checkout iniciado rastreado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao rastrear checkout iniciado:', error);
    throw error;
  }
};

// Função para rastrear início do quiz (REMOVIDA - agora é feita automaticamente)
// O visitante quiz_inicio é registrado quando a página muda para 'quiz'
export const trackQuizStart = async () => {
  console.log('🎯 trackQuizStart chamado (sem ação - removida duplicação)');
  // Não faz nada - o visitante é registrado automaticamente quando chega na página
};

// Função para rastrear visitante em uma pergunta específica
export const trackQuestionVisitor = async (questionNumber: number) => {
  console.log(`📍 trackQuestionVisitor chamado: pergunta ${questionNumber}`);
  try {
    await apiRequest('POST', '/api/metrics/visitor', { etapa: `quiz_pergunta_${questionNumber}` });
    console.log(`✅ Visitante pergunta ${questionNumber} rastreado`);
  } catch (error) {
    console.error(`❌ Erro ao rastrear visitante na pergunta ${questionNumber}:`, error);
  }
};

// Função para rastrear conversão de uma pergunta específica (REMOVIDA - agora direto no QuizFlow)
// A lógica de tracking agora está diretamente no handleQuizAnswer para evitar duplicações
export const trackQuestionConversion = async (questionNumber: number) => {
  console.log(`🎯 trackQuestionConversion chamado (sem ação - movido para QuizFlow): pergunta ${questionNumber}`);
  // Não faz nada - a lógica foi movida para o handleQuizAnswer
};

// Função para rastrear conversão da página de vendas (ADD TO CART)
export const trackSalesConversion = async () => {
  console.log('🛒 trackSalesConversion (ADD TO CART) chamado:', { sessionId, sessionInitialized });
  
  const executeTrack = async () => {
    if (sessionId) {
      try {
        // Registra conversão da página de vendas (ADD TO CART)
        await apiRequest('POST', '/api/metrics/conversion', { 
          etapaOrigem: 'sales', 
          etapaDestino: 'sales_conversion' 
        });
        console.log('✅ Conversão da página de vendas (ADD TO CART) rastreada');
      } catch (error) {
        console.error('❌ Erro ao rastrear conversão da página de vendas:', error);
      }
    } else {
      // Se não há sessionId, vamos tentar criar uma nova sessão
      console.warn('⚠️ SessionId não disponível para trackSalesConversion - tentando inicializar nova sessão');
      try {
        const response = await apiRequest('POST', '/api/metrics/session') as unknown as { sessionId: number };
        sessionId = response.sessionId;
        sessionInitialized = true;
        console.log('✅ Nova sessão criada para trackSalesConversion:', { sessionId });
        
        // Agora tenta fazer o tracking novamente
        await apiRequest('POST', '/api/metrics/conversion', { 
          etapaOrigem: 'sales', 
          etapaDestino: 'sales_conversion' 
        });
        console.log('✅ Conversão da página de vendas (ADD TO CART) rastreada após criar nova sessão');
      } catch (error) {
        console.error('❌ Erro ao criar nova sessão ou rastrear conversão:', error);
      }
    }
  };
  
  if (sessionInitialized) {
    await executeTrack();
  } else {
    console.log('📝 Enfileirando trackSalesConversion até sessão estar pronta');
    actionQueue.push(executeTrack);
  }
};

// Função específica para rastrear ADD TO CART
export const trackAddToCart = async () => {
  console.log('🛒 trackAddToCart chamado - fazendo chamada direta');
  
  try {
    // Faz chamada direta para add-to-cart (o backend vai usar sessionId da requisição)
    const response = await apiRequest('POST', '/api/metrics/add-to-cart', {});
    console.log('✅ Add to cart rastreado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao rastrear add to cart:', error);
    throw error;
  }
};

// Hook para rastrear tempo em uma página
export const useTrackTime = (etapa: string) => {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      // Aqui poderíamos enviar o tempo gasto, mas para simplicidade vamos omitir
    };
  }, [etapa]);
};

// Função para rastrear abandono
export const trackAbandono = async (etapa: string, tipo: 'inatividade' | 'fechamento' = 'inatividade') => {
  console.log('⚠️ trackAbandono chamado:', { sessionId, etapa, tipo, sessionInitialized });
  
  const executeTrack = async () => {
    if (sessionId) {
      try {
        await apiRequest('POST', '/api/metrics/abandono', { sessionId, etapa, tipo });
        console.log('✅ Abandono rastreado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao rastrear abandono:', error);
      }
    } else {
      console.warn('⚠️ SessionId não disponível para trackAbandono');
    }
  };
  
  if (sessionInitialized) {
    await executeTrack();
  } else {
    console.log('📝 Enfileirando trackAbandono até sessão estar pronta');
    actionQueue.push(executeTrack);
  }
};

// Hook para detectar abandono por inatividade ou fechamento
export const useAbandonoDetection = (etapaAtual: string) => {
  const timerInatividade = useRef<NodeJS.Timeout | null>(null);
  const ultimaAtividade = useRef<number>(Date.now());
  
  useEffect(() => {
    const resetTimer = () => {
      ultimaAtividade.current = Date.now();
      
      // Limpar timer anterior
      if (timerInatividade.current) {
        clearTimeout(timerInatividade.current);
      }
      
      // Configurar novo timer de 5 minutos (300000ms)
      timerInatividade.current = setTimeout(() => {
        console.log('⏰ Usuário inativo por 5 minutos, registrando abandono');
        trackAbandono(etapaAtual, 'inatividade');
      }, 300000); // 5 minutos
    };

    // Eventos que indicam atividade do usuário
    const eventosAtividade = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Adicionar listeners
    eventosAtividade.forEach(evento => {
      document.addEventListener(evento, resetTimer, true);
    });
    
    // Detectar fechamento da página
    const handleBeforeUnload = () => {
      console.log('🚪 Usuário fechando página, registrando abandono');
      trackAbandono(etapaAtual, 'fechamento');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Iniciar timer
    resetTimer();
    
    // Cleanup
    return () => {
      if (timerInatividade.current) {
        clearTimeout(timerInatividade.current);
      }
      
      eventosAtividade.forEach(evento => {
        document.removeEventListener(evento, resetTimer, true);
      });
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [etapaAtual]);
};