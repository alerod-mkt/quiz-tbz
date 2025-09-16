// Utilitários para tracking e detecção de bots/geolocalização
export interface LocationData {
  country: string;
  country_code: string;
  city: string;
  region: string;
  is_brazil: boolean;
}

export interface TrackingDecision {
  should_count: boolean;
  is_bot: boolean;
  location: LocationData | null;
  reason?: string;
}

// Regex específico para bots conhecidos (mais restritivo, permitindo apps legítimos)
const BOT_PATTERN = /\bbot\b|crawler|spider|slurp|bingpreview|googlebot|yandexbot|baiduspider|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|whatsappbot|telegrambot|curl|wget|postman|python-requests|java\/[\d.]+|node-fetch|axios\/[\d.]+|monitoring|uptime|pingdom|newrelic|datadog|scraper|fetcher/i;

// Detectar se é um bot baseado no user-agent
export function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent || userAgent.trim().length === 0) {
    return true; // Sem user-agent = provavelmente bot
  }

  // Usar regex mais específico para evitar falsos positivos
  return BOT_PATTERN.test(userAgent);
}

// Obter dados de geolocalização do IP
export async function getLocationFromIP(ipAddress: string): Promise<LocationData | null> {
  try {
    // Normalizar IP (remover prefix IPv6-to-IPv4)
    const normalizedIP = ipAddress.replace(/^::ffff:/, '');
    
    // IPs locais/internos não devem ser geolocalizados
    if (ipAddress === 'unknown' || 
        normalizedIP === '::1' ||
        normalizedIP.startsWith('127.') || 
        normalizedIP.startsWith('192.168.') || 
        normalizedIP.startsWith('10.') || 
        normalizedIP.startsWith('172.')) {
      console.log(`📍 IP ${ipAddress} é local/interno - assumindo Brasil para testes`);
      // Para IPs locais, assumir Brasil durante desenvolvimento
      return {
        country: 'Brazil',
        country_code: 'BR',
        city: 'Local',
        region: 'Desenvolvimento',
        is_brazil: true
      };
    }

    // Tentar primeira API (ipapi.co)
    try {
      const response = await fetch(`http://ipapi.co/${ipAddress}/json/`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.error) {
          return {
            country: data.country_name || 'Desconhecido',
            country_code: data.country_code || '',
            city: data.city || 'Desconhecida',
            region: data.region || '',
            is_brazil: (data.country_code || '').toUpperCase() === 'BR'
          };
        }
      }
    } catch (error) {
      console.log(`⚠️ API ipapi.co falhou, tentando backup...`);
    }

    // Tentar API backup (ip-api.com)
    try {
      const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,regionName,city`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'success') {
          return {
            country: data.country || 'Desconhecido',
            country_code: data.countryCode || '',
            city: data.city || 'Desconhecida',
            region: data.regionName || '',
            is_brazil: (data.countryCode || '').toUpperCase() === 'BR'
          };
        }
      }
    } catch (error) {
      console.log(`⚠️ API backup ip-api.com também falhou`);
    }

    console.warn(`❌ Não foi possível obter localização para IP ${ipAddress} - todas as APIs falharam`);
    return null;
    
  } catch (error) {
    console.error(`Erro ao obter localização do IP ${ipAddress}:`, error);
    return null;
  }
}

// Decisão principal: deve contar a visita?
export async function shouldCountVisit(
  ipAddress: string, 
  userAgent: string
): Promise<TrackingDecision> {
  // 1. Verificar se é bot
  const is_bot = isBotUserAgent(userAgent);
  
  if (is_bot) {
    return {
      should_count: false,
      is_bot: true,
      location: null,
      reason: 'Bot detectado pelo user-agent'
    };
  }

  // 2. Obter localização
  const location = await getLocationFromIP(ipAddress);
  
  // 3. Se não conseguiu obter localização, não conta (por segurança)
  if (!location) {
    return {
      should_count: false,
      is_bot: false,
      location: null,
      reason: 'Não foi possível determinar localização'
    };
  }

  // 4. Só conta se for do Brasil
  if (!location.is_brazil) {
    return {
      should_count: false,
      is_bot: false,
      location,
      reason: 'Tráfego de fora do Brasil'
    };
  }

  // 5. Tudo OK - contar a visita
  return {
    should_count: true,
    is_bot: false,
    location,
    reason: 'Visita válida do Brasil'
  };
}