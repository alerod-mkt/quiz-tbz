import { EventType } from './types';

// URLs hardcoded baseadas no seu projeto Supabase
const SUPABASE_URL = "https://ynxsksgttbzxooixgqzf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlueHNrc2d0dGJ6eG9vaXhncXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTU4ODAsImV4cCI6MjA3NDM5MTg4MH0.PTAaE9WV6gjpDwlQuRY_HZjI-k5BCZ5yoyIjSSfIg";

// Função para gerar session ID único
const generateSessionId = (): string => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

// Função para registrar evento no banco de dados
export const trackEvent = async (eventType: EventType, payload?: any): Promise<string> => {
  try {
    const sessionId = payload?.sessionId || generateSessionId();
    
    const body = {
      session_id: sessionId,
      event_type: eventType,
      event_data: {
        ...payload
      }
    };
    
    // Não aguardamos a resposta para não bloquear a UI
    fetch(`${SUPABASE_URL}/functions/v1/track-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    }).then(response => {
      if (!response.ok) {
        response.json().then(responseData => {
          console.error('Erro ao registrar evento (async):', response.status, response.statusText, responseData);
        }).catch(() => {
          console.error('Erro ao registrar evento (async):', response.status, response.statusText);
        });
      }
    }).catch(error => {
      console.error('Erro CRÍTICO ao registrar evento (async):', error);
    });
    
    return sessionId;
  } catch (error: unknown) {
    console.error('Erro CRÍTICO ao iniciar rastreamento de evento:', error);
    return generateSessionId();
  }
};

// Função para registrar abandono
export const trackAbandonment = async (sessionId: string, reason: string, step: string): Promise<void> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/track-abandonment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        reason,
        step_where_abandoned: step
      })
    });
    
    if (!response.ok) {
      console.error('Erro ao registrar abandono:', response.status);
    }
  } catch (error: unknown) {
    console.error('Erro ao registrar abandono:', error);
  }
};

// Função para obter métricas (requer autenticação)
export const getMetrics = async (dateFilter: string, customDate?: string): Promise<any> => {
  try {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ date_filter: dateFilter, custom_date: customDate })
    });
    
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || 'Falha ao buscar métricas');
    }
    
    return await response.json();
    
  } catch (error: unknown) {
    console.error("Erro ao carregar métricas:", error);
    throw error;
  }
};

// Função para obter visitas detalhadas
export const getVisits = async (dateFilter: string, customDate?: string): Promise<any> => {
  try {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ date_filter: dateFilter, custom_date: customDate })
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || 'Falha ao buscar visitas');
    }

    const data = await response.json();
    return data.visits;

  } catch (error: unknown) {
    console.error("Erro ao carregar visitas:", error);
    throw error;
  }
};

// Função para obter vendas detalhadas (NOVA)
export const getSales = async (dateFilter: string, customDate?: string): Promise<any> => {
  try {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ date_filter: dateFilter, custom_date: customDate })
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || 'Falha ao buscar vendas');
    }

    const data = await response.json();
    return data.sales;

  } catch (error: unknown) {
    console.error("Erro ao carregar vendas:", error);
    throw error;
  }
};

// Função para remover dados de um IP
export const removeIpData = async (ipAddress: string): Promise<any> => {
  try {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/remove-ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ ip_address: ipAddress })
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || 'Falha ao remover dados do IP');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Erro na função removeIpData:", error);
    throw error;
  }
};

// Função para limpar todas as métricas
export const clearAllMetrics = async (): Promise<any> => {
  try {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/clear-metrics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || 'Falha ao limpar as métricas');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error("Erro na função clearAllMetrics:", error);
    throw error;
  }
};