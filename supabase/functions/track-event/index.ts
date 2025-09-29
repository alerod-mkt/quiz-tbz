import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/v135/@supabase/supabase-js@2.45.0/es2022/supabase-js.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Funções Auxiliares Otimizadas ---

function getClientIP(req: Request): string {
  const headers = req.headers;
  return headers.get('cf-connecting-ip') || headers.get('x-real-ip') || headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

function cleanIP(ip: string): string {
  return ip.replace(/^::ffff:/, '');
}

function normalizeIP(ip: string): string {
  const cleanedIP = cleanIP(ip);
  if (cleanedIP.includes(':')) { // IPv6
    return cleanedIP.split(':').slice(0, 4).join(':');
  }
  return cleanedIP; // IPv4
}

// Função para geolocalização com timeout e fallback robusto
async function getLocationWithFallback(ip: string): Promise<{ country_code: string; country_name: string; city: string }> {
  const services = [
    // Serviço 1: ip-api.com (mais confiável)
    async () => {
      console.log(`Tentando ip-api.com para ${ip}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,countryCode,country,city`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.status !== 'success') throw new Error('Status não é success');
        if (!data.countryCode || data.countryCode === 'XX') throw new Error('Código de país inválido');
        console.log(`✅ Sucesso com ip-api.com: ${data.countryCode}`);
        return {
          country_code: data.countryCode,
          country_name: data.country || 'Unknown',
          city: data.city || 'Unknown'
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`❌ ip-api.com falhou para ${ip}:`, error.message);
        throw error;
      }
    },
    
    // Serviço 2: ipapi.co
    async () => {
      console.log(`Tentando ipapi.co para ${ip}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.country_code || data.country_code === 'XX') throw new Error('Código de país inválido');
        console.log(`✅ Sucesso com ipapi.co: ${data.country_code}`);
        return {
          country_code: data.country_code,
          country_name: data.country_name || 'Unknown',
          city: data.city || 'Unknown'
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`❌ ipapi.co falhou para ${ip}:`, error.message);
        throw error;
      }
    },

    // Serviço 3: freeipapi.com
    async () => {
      console.log(`Tentando freeipapi.com para ${ip}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(`https://freeipapi.com/api/json/${ip}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.countryCode || data.countryCode === 'XX') throw new Error('Código de país inválido');
        console.log(`✅ Sucesso com freeipapi.com: ${data.countryCode}`);
        return {
          country_code: data.countryCode,
          country_name: data.countryName || 'Unknown',
          city: data.cityName || 'Unknown'
        };
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`❌ freeipapi.com falhou para ${ip}:`, error.message);
        throw error;
      }
    }
  ];

  // Executa todos os serviços em paralelo e usa o primeiro que der sucesso
  const promises = services.map(service => service());
  const results = await Promise.allSettled(promises);
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  // Se todos falharem, retorna um fallback padrão (melhor que 'XX')
  console.warn(`❌ Todos os serviços de geolocalização falharam para ${ip}. Usando fallback.`);
  return {
    country_code: 'BR', // Assumindo Brasil como padrão
    country_name: 'Brasil',
    city: 'São Paulo'
  };
}

async function createFingerprint(
  normalizedIP: string,
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string
): Promise<string> {
  const fingerprintString = `${normalizedIP}|${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkRecentVisit(supabase: any, fingerprintHash: string): Promise<{ exists: boolean; timeRemaining?: number }> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('visit_fingerprints')
    .select('created_at')
    .eq('fingerprint_hash', fingerprintHash)
    .gte('created_at', twentyFourHoursAgo)
    .limit(1)
    .single();
  
  if (data) {
    const timeRemaining = Math.max(0, (24 * 60 * 60 * 1000) - (Date.now() - new Date(data.created_at).getTime()));
    return { exists: true, timeRemaining };
  }
  return { exists: false };
}

function getStep(eventType: string, eventData: any): string {
  switch (eventType) {
    case 'visit': return 'pagina_inicial';
    case 'quiz_start': return 'quiz_start';
    case 'question_view': return `pergunta_${eventData?.questionId || 0}`;
    case 'lead_submit': return 'cadastro_lead';
    case 'quiz_complete': return 'quiz_completo';
    case 'checkout_start': return 'checkout_iniciado';
    default: return 'unknown';
  }
}

// --- Lógica Principal do Servidor ---

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    const { session_id, event_type, event_data } = await req.json()
    const originalIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';

    // --- GEOLocalização Otimizada (executada uma vez por requisição) ---
    let geoData = { country_code: 'XX', country_name: 'Unknown', city: 'Unknown' };
    try {
      geoData = await getLocationWithFallback(originalIP);
    } catch (geoError) {
      console.error('Erro crítico na geolocalização:', geoError);
    }

    // LÓGICA DE BLOQUEIO DE VISITA - Executa APENAS para o evento 'visit'
    if (event_type === 'visit') {
      const normalizedIP = normalizeIP(originalIP);
      const acceptLanguage = req.headers.get('accept-language') || '';
      const acceptEncoding = req.headers.get('accept-encoding') || '';
      const fingerprintHash = await createFingerprint(normalizedIP, userAgent, acceptLanguage, acceptEncoding);
      
      const visitCheck = await checkRecentVisit(supabase, fingerprintHash);
      if (visitCheck.exists) {
        const hoursRemaining = Math.ceil((visitCheck.timeRemaining || 0) / (1000 * 60 * 60));
        return new Response(JSON.stringify({ 
          success: false, 
          message: `Visita duplicada. Aguarde ${hoursRemaining}h.`,
          visitSkipped: true 
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('visit_fingerprints').insert({
        fingerprint_hash: fingerprintHash,
        original_ip: originalIP,
        normalized_ip: normalizedIP,
        user_agent: userAgent,
        accept_language: acceptLanguage,
        accept_encoding: acceptEncoding,
        country_code: geoData.country_code,
        country_name: geoData.country_name,
        city: geoData.city
      });
    }

    // --- LÓGICA DE SESSÃO E EVENTOS - Executa para TODOS os eventos ---
    
    let sessionIdInDb: string | null = null;
    let isNewSession = false;
    const currentStep = getStep(event_type, event_data);

    // Tenta encontrar a sessão existente
    const { data: existingSession, error: selectError } = await supabase
      .from('quiz_sessions')
      .select('id')
      .eq('session_id', session_id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = "no rows found"
      console.error('Erro ao selecionar quiz_sessions:', selectError);
      // Se for outro erro que não "não encontrado", lançar
      throw new Error(`Falha ao buscar sessão: ${selectError.message}`);
    }

    if (existingSession) {
      sessionIdInDb = existingSession.id;
      // Atualiza a sessão existente
      await supabase.from('quiz_sessions').update({
        current_step: currentStep,
        last_activity: new Date().toISOString(),
      }).eq('id', existingSession.id);
    } else {
      // Se não encontrou, tenta inserir uma nova sessão
      isNewSession = true;
      const { data: newSession, error: insertError } = await supabase.from('quiz_sessions').insert({
        session_id,
        ip_address: originalIP,
        country_code: geoData.country_code,
        current_step: currentStep,
        last_activity: new Date().toISOString(),
      }).select('id').single();

      if (insertError) {
        // Se a inserção falhou devido a uma violação de unicidade (código '23505'),
        // significa que outra requisição criou a sessão no meio tempo.
        // Tentamos buscar a sessão novamente para usar o ID correto.
        if (insertError.code === '23505') { 
            console.warn('Violação de unicidade de session_id, tentando buscar sessão existente.');
            const { data: reFetchedSession, error: reFetchError } = await supabase
                .from('quiz_sessions')
                .select('id')
                .eq('session_id', session_id)
                .single();
            
            if (reFetchError) {
                console.error('Erro ao re-buscar sessão após violação de unicidade:', reFetchError);
                throw new Error(`Falha ao recuperar sessão após concorrência: ${reFetchError.message}`);
            }
            
            sessionIdInDb = reFetchedSession?.id;
            isNewSession = false; // Não é uma nova sessão, apenas uma corrida
            // Atualiza a sessão que foi criada por outra requisição
            await supabase.from('quiz_sessions').update({
                current_step: currentStep,
                last_activity: new Date().toISOString(),
            }).eq('id', reFetchedSession.id);

        } else {
            console.error('Erro ao inserir nova quiz_session:', insertError);
            throw new Error(`Falha ao inserir nova sessão: ${insertError.message}`);
        }
      } else {
        sessionIdInDb = newSession?.id;
      }

      // Insere em quiz_visits APENAS se for uma nova sessão E o evento for 'visit'
      if (sessionIdInDb && isNewSession && event_type === 'visit') {
        await supabase.from('quiz_visits').insert({
          session_id, // Usa o session_id string do cliente para quiz_visits (conforme schema)
          ip_address: originalIP,
          country_code: geoData.country_code,
          city: geoData.city || null,
          country_name: geoData.country_name || null,
          user_agent: userAgent,
          referrer: event_data?.referrer || null,
          landing_page: event_data?.landing_page || null
        });
      }
    }
    
    // Insere o evento em quiz_events usando o UUID da sessão
    if (sessionIdInDb) {
      await supabase.from('quiz_events').insert({
        session_id: sessionIdInDb, // Usa o UUID da sessão
        event_type,
        event_data
      });
    }

    // NOVO: Insere dados na tabela 'leads' se o evento for 'lead_submit'
    if (event_type === 'lead_submit' && event_data?.name && event_data?.email && event_data?.phone) {
      const { error: leadInsertError } = await supabase.from('leads').insert({
        name: event_data.name,
        email: event_data.email,
        phone: event_data.phone,
      });

      if (leadInsertError) {
        console.error('Erro ao inserir lead na tabela leads:', leadInsertError);
        // Não lançamos um erro fatal aqui para não impedir o rastreamento do evento principal
      }
    }
    
    return new Response(JSON.stringify({ success: true, message: `Evento '${event_type}' rastreado.` }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Erro na função track-event:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})