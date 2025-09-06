import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MetricasEtapa {
  nome: string;
  visitantes: number;
  conversoes: number;
  taxa_conversao: number;
  tempo_medio_segundos: number;
}

interface FunilStats {
  etapas: { [key: string]: MetricasEtapa };
  ultima_atualizacao: string;
}

interface MetricasDiarias {
  [data: string]: {
    data: string;
    visitantes_unicos: number;
    quiz_iniciados: number;
    quiz_completados: number;
    vsl_visualizacoes: number;
    sales_visualizacoes: number;
    conversoes_compra: number;
    taxa_conversao_geral: number;
    tempo_medio_total: number;
    urgencia_critica: number;
    urgencia_alta: number;
    urgencia_moderada: number;
    horarios_atividade: { [hora: string]: number };
  };
}

interface SessaoAnonima {
  id: number;
  timestamp_inicio: string;
  etapa_inicial: string;
  etapa_final: string;
  tempo_total_segundos: number;
  perguntas_respondidas: number;
  resultado_urgencia: string;
  abandonou_em: string | null;
  completou: boolean;
  hora_acesso: number;
  data_acesso: string;
}

interface Sessoes {
  sessoes: SessaoAnonima[];
  ultima_sessao_id: number;
}

const DATA_DIR = path.join(__dirname, 'data');

// Mutex para controlar escritas simultâneas
const writeLocks = new Map<string, Promise<void>>();

// Garantir que o diretório de dados existe
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Carregar arquivo JSON com fallback e validação de integridade
async function loadJsonFile<T>(filename: string, defaultData: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsedData = JSON.parse(data);
    
    // Validação de integridade: verificar se o arquivo não está vazio ou corrompido
    if (!parsedData || (typeof parsedData === 'object' && Object.keys(parsedData).length === 0 && filename !== 'metricas_diarias.json')) {
      console.warn(`Arquivo ${filename} estava vazio ou corrompido, restaurando backup ou dados padrão`);
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    
    return parsedData;
  } catch (error) {
    console.warn(`Erro ao ler ${filename}, criando novo arquivo:`, error);
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

// Salvar arquivo JSON com backup de segurança e mutex
async function saveJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const backupPath = path.join(DATA_DIR, `${filename}.backup`);
  const tempPath = path.join(DATA_DIR, `${filename}.tmp`);
  
  // Controlar escritas simultâneas usando mutex
  const currentLock = writeLocks.get(filename);
  if (currentLock) {
    await currentLock;
  }
  
  const saveOperation = (async () => {
    try {
      // Fazer backup do arquivo existente antes de sobrescrever
      try {
        await fs.access(filePath);
        await fs.copyFile(filePath, backupPath);
      } catch {
        // Arquivo não existe ainda, normal para primeira execução
      }
      
      // Escrever para arquivo temporário primeiro
      const jsonString = JSON.stringify(data, null, 2);
      await fs.writeFile(tempPath, jsonString);
      
      // Verificar integridade do arquivo temporário
      const tempData = await fs.readFile(tempPath, 'utf-8');
      if (tempData.trim().length === 0) {
        throw new Error('Arquivo temporário está vazio');
      }
      JSON.parse(tempData); // Teste de parsing
      
      // Apenas renomear o arquivo temporário para o final (operação atômica)
      await fs.rename(tempPath, filePath);
      
    } catch (error) {
      console.error(`Erro ao salvar ${filename}, tentando restaurar backup:`, error);
      
      // Limpar arquivo temporário se existir
      try {
        await fs.unlink(tempPath);
      } catch {}
      
      // Tentar restaurar do backup
      try {
        await fs.access(backupPath);
        await fs.copyFile(backupPath, filePath);
        console.log(`Backup restaurado para ${filename}`);
      } catch (backupError) {
        console.error(`Não foi possível restaurar backup para ${filename}:`, backupError);
        // Como último recurso, criar arquivo com dados padrão
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      }
    } finally {
      writeLocks.delete(filename);
    }
  })();
  
  writeLocks.set(filename, saveOperation);
  await saveOperation;
}

// Obter data atual no formato YYYY-MM-DD (fuso horário de São Paulo UTC-3)
function getToday(): string {
  const now = new Date();
  // Ajustar para fuso horário de São Paulo (UTC-3)
  const saoPauloTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  return saoPauloTime.toISOString().split('T')[0];
}

// Obter hora atual (0-23) no fuso horário de São Paulo
function getCurrentHour(): number {
  const now = new Date();
  // Ajustar para fuso horário de São Paulo (UTC-3)
  const saoPauloTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  return saoPauloTime.getHours();
}

// Obter timestamp formatado para São Paulo
function getSaoPauloTimestamp(): string {
  const now = new Date();
  const saoPauloTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  return saoPauloTime.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Inicializar métricas do dia se não existir
async function initDailyMetrics(date: string): Promise<void> {
  const metricas = await loadJsonFile<MetricasDiarias>('metricas_diarias.json', {});
  
  if (!metricas[date]) {
    metricas[date] = {
      data: date,
      visitantes_unicos: 0,
      quiz_iniciados: 0,
      quiz_completados: 0,
      vsl_visualizacoes: 0,
      sales_visualizacoes: 0,
      conversoes_compra: 0,
      taxa_conversao_geral: 0,
      tempo_medio_total: 0,
      urgencia_critica: 0,
      urgencia_alta: 0,
      urgencia_moderada: 0,
      horarios_atividade: {
        "00": 0, "01": 0, "02": 0, "03": 0, "04": 0, "05": 0,
        "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0,
        "12": 0, "13": 0, "14": 0, "15": 0, "16": 0, "17": 0,
        "18": 0, "19": 0, "20": 0, "21": 0, "22": 0, "23": 0
      }
    };
    
    await saveJsonFile('metricas_diarias.json', metricas);
  }
}

export class MetricsCollector {
  
  // Registrar visitante em uma etapa
  static async trackVisitor(etapa: string): Promise<void> {
    const today = getToday();
    const hour = getCurrentHour();
    
    await initDailyMetrics(today);
    
    // Atualizar funil stats com verificação de integridade
    const funilStats = await loadJsonFile<FunilStats>('funil_stats.json', {
      etapas: {},
      ultima_atualizacao: new Date().toISOString()
    });
    
    if (!funilStats.etapas[etapa]) {
      funilStats.etapas[etapa] = {
        nome: etapa,
        visitantes: 0,
        conversoes: 0,
        taxa_conversao: 0,
        tempo_medio_segundos: 0
      };
    }
    
    // Garantir que o contador nunca regrida
    const visitantesAnterior = funilStats.etapas[etapa].visitantes || 0;
    funilStats.etapas[etapa].visitantes = Math.max(visitantesAnterior + 1, visitantesAnterior);
    funilStats.ultima_atualizacao = new Date().toISOString();
    
    // Atualizar métricas diárias com verificação de integridade
    const metricas = await loadJsonFile<MetricasDiarias>('metricas_diarias.json', {});
    const hourStr = hour.toString().padStart(2, '0');
    
    // Garantir que todos os contadores sempre incrementem, nunca retrocedam
    if (etapa === 'landing') {
      const anterior = metricas[today].visitantes_unicos || 0;
      metricas[today].visitantes_unicos = Math.max(anterior + 1, anterior);
    } else if (etapa === 'quiz_inicio') {
      const anterior = metricas[today].quiz_iniciados || 0;
      metricas[today].quiz_iniciados = Math.max(anterior + 1, anterior);
    } else if (etapa === 'vsl') {
      const anterior = metricas[today].vsl_visualizacoes || 0;
      metricas[today].vsl_visualizacoes = Math.max(anterior + 1, anterior);
    } else if (etapa === 'sales') {
      const anterior = metricas[today].sales_visualizacoes || 0;
      metricas[today].sales_visualizacoes = Math.max(anterior + 1, anterior);
    } else if (etapa === 'checkout_iniciado') {
      const anterior = metricas[today].conversoes_compra || 0;
      metricas[today].conversoes_compra = Math.max(anterior + 1, anterior);
    }
    
    const horariosAnterior = metricas[today].horarios_atividade[hourStr] || 0;
    metricas[today].horarios_atividade[hourStr] = Math.max(horariosAnterior + 1, horariosAnterior);
    
    await Promise.all([
      saveJsonFile('funil_stats.json', funilStats),
      saveJsonFile('metricas_diarias.json', metricas)
    ]);
  }
  
  // Registrar conversão entre etapas
  static async trackConversion(etapaOrigem: string, etapaDestino: string): Promise<void> {
    const funilStats = await loadJsonFile<FunilStats>('funil_stats.json', {
      etapas: {},
      ultima_atualizacao: new Date().toISOString()
    });
    
    if (funilStats.etapas[etapaOrigem]) {
      // Garantir que conversões sempre incrementem
      const conversoesAnterior = funilStats.etapas[etapaOrigem].conversoes || 0;
      funilStats.etapas[etapaOrigem].conversoes = Math.max(conversoesAnterior + 1, conversoesAnterior);
      
      // Recalcular taxa de conversão com valores seguros
      const visitantes = funilStats.etapas[etapaOrigem].visitantes || 1;
      funilStats.etapas[etapaOrigem].taxa_conversao = 
        (funilStats.etapas[etapaOrigem].conversoes / visitantes) * 100;
    }
    
    funilStats.ultima_atualizacao = new Date().toISOString();
    await saveJsonFile('funil_stats.json', funilStats);
  }
  
  // Iniciar nova sessão anônima
  static async startSession(): Promise<number> {
    const sessoes = await loadJsonFile<Sessoes>('sessoes.json', {
      sessoes: [],
      ultima_sessao_id: 0
    });
    
    const sessionId = sessoes.ultima_sessao_id + 1;
    const today = getToday();
    
    const novaSessao: SessaoAnonima = {
      id: sessionId,
      timestamp_inicio: new Date().toISOString(),
      etapa_inicial: 'landing',
      etapa_final: 'landing',
      tempo_total_segundos: 0,
      perguntas_respondidas: 0,
      resultado_urgencia: '',
      abandonou_em: null,
      completou: false,
      hora_acesso: getCurrentHour(),
      data_acesso: today
    };
    
    sessoes.sessoes.push(novaSessao);
    sessoes.ultima_sessao_id = sessionId;
    
    await saveJsonFile('sessoes.json', sessoes);
    
    return sessionId;
  }
  
  // Atualizar sessão
  static async updateSession(
    sessionId: number, 
    updates: Partial<SessaoAnonima>
  ): Promise<void> {
    const sessoes = await loadJsonFile<Sessoes>('sessoes.json', {
      sessoes: [],
      ultima_sessao_id: 0
    });
    
    const sessaoIndex = sessoes.sessoes.findIndex(s => s.id === sessionId);
    
    if (sessaoIndex !== -1) {
      Object.assign(sessoes.sessoes[sessaoIndex], updates);
      await saveJsonFile('sessoes.json', sessoes);
    }
  }
  
  // Registrar quiz completado
  static async trackQuizCompleted(sessionId: number, urgencia: string): Promise<void> {
    const today = getToday();
    await initDailyMetrics(today);
    
    // Atualizar sessão
    await this.updateSession(sessionId, {
      etapa_final: 'quiz_completado',
      resultado_urgencia: urgencia,
      perguntas_respondidas: 15,
      completou: true
    });
    
    // Atualizar métricas diárias com verificação de integridade
    const metricas = await loadJsonFile<MetricasDiarias>('metricas_diarias.json', {});
    
    // Garantir incremento seguro
    const completadosAnterior = metricas[today].quiz_completados || 0;
    metricas[today].quiz_completados = Math.max(completadosAnterior + 1, completadosAnterior);
    
    if (urgencia === 'HIGH_URGENCY') {
      const criticaAnterior = metricas[today].urgencia_critica || 0;
      metricas[today].urgencia_critica = Math.max(criticaAnterior + 1, criticaAnterior);
    } else if (urgencia === 'MEDIUM_URGENCY') {
      const altaAnterior = metricas[today].urgencia_alta || 0;
      metricas[today].urgencia_alta = Math.max(altaAnterior + 1, altaAnterior);
    } else {
      const moderadaAnterior = metricas[today].urgencia_moderada || 0;
      metricas[today].urgencia_moderada = Math.max(moderadaAnterior + 1, moderadaAnterior);
    }
    
    // Recalcular taxa de conversão geral com valores seguros
    const visitantesUnicos = metricas[today].visitantes_unicos || 1;
    if (visitantesUnicos > 0) {
      metricas[today].taxa_conversao_geral = 
        (metricas[today].quiz_completados / visitantesUnicos) * 100;
    }
    
    await saveJsonFile('metricas_diarias.json', metricas);
  }
  
  // Registrar início do checkout
  static async trackPurchase(sessionId: number): Promise<void> {
    const today = getToday();
    await initDailyMetrics(today);
    
    // Atualizar sessão
    await this.updateSession(sessionId, {
      etapa_final: 'checkout_iniciado'
    });
    
    // Rastrear como visitante na etapa checkout_iniciado
    await this.trackVisitor('checkout_iniciado');
  }
  
  // Resetar todas as métricas e começar do zero
  static async resetMetrics(): Promise<void> {
    await ensureDataDir();
    
    const emptyFunil: FunilStats = {
      etapas: {},
      ultima_atualizacao: new Date().toISOString()
    };
    
    const emptyMetricas: MetricasDiarias = {};
    
    const emptySessoes: Sessoes = {
      sessoes: [],
      ultima_sessao_id: 0
    };
    
    await Promise.all([
      saveJsonFile('funil_stats.json', emptyFunil),
      saveJsonFile('metricas_diarias.json', emptyMetricas),
      saveJsonFile('sessoes.json', emptySessoes)
    ]);
  }
  
  // Consolidar dados de etapas similares
  static async consolidateStageData(funilStats: FunilStats): Promise<void> {
    const consolidatedData: { [key: string]: { visitantes: number, conversoes: number } } = {};
    
    // Agrupar dados por etapa principal
    Object.entries(funilStats.etapas).forEach(([stageName, stageData]) => {
      let mainStage = stageName;
      
      // Mapear etapas específicas para etapas principais
      if (stageName.startsWith('quiz_pergunta')) {
        mainStage = 'quiz_inicio';
      } else if (stageName === 'landing' || stageName.includes('landing')) {
        mainStage = 'landing';
      } else if (stageName === 'vsl' || stageName.includes('vsl')) {
        mainStage = 'vsl';
      } else if (stageName === 'sales' || stageName.includes('sales')) {
        mainStage = 'sales';
      } else if (stageName.includes('checkout')) {
        mainStage = 'checkout_iniciado';
      }
      
      if (!consolidatedData[mainStage]) {
        consolidatedData[mainStage] = { visitantes: 0, conversoes: 0 };
      }
      
      consolidatedData[mainStage].visitantes += stageData.visitantes || 0;
      consolidatedData[mainStage].conversoes += stageData.conversoes || 0;
    });
    
    // Atualizar funilStats com dados consolidados
    Object.entries(consolidatedData).forEach(([mainStage, data]) => {
      if (!funilStats.etapas[mainStage]) {
        funilStats.etapas[mainStage] = {
          nome: mainStage,
          visitantes: 0,
          conversoes: 0,
          taxa_conversao: 0,
          tempo_medio_segundos: 0
        };
      }
      
      // Somar dados existentes com consolidados - SEMPRE somar, nunca usar apenas o máximo
      const existingVisitors = funilStats.etapas[mainStage].visitantes || 0;
      const existingConversions = funilStats.etapas[mainStage].conversoes || 0;
      
      funilStats.etapas[mainStage].visitantes = existingVisitors + data.visitantes;
      funilStats.etapas[mainStage].conversoes = existingConversions + data.conversoes;
      
      // Recalcular taxa de conversão
      if (funilStats.etapas[mainStage].visitantes > 0) {
        funilStats.etapas[mainStage].taxa_conversao = 
          (funilStats.etapas[mainStage].conversoes / funilStats.etapas[mainStage].visitantes) * 100;
      }
    });
  }

  // Obter métricas para dashboard SEM consolidação automática
  static async getDashboardMetrics() {
    const [funilStats, metricas, sessoes] = await Promise.all([
      loadJsonFile<FunilStats>('funil_stats.json', { etapas: {}, ultima_atualizacao: new Date().toISOString() }),
      loadJsonFile<MetricasDiarias>('metricas_diarias.json', {}),
      loadJsonFile<Sessoes>('sessoes.json', { sessoes: [], ultima_sessao_id: 0 })
    ]);
    
    // Garantir que todas as etapas principais existam, mas NÃO consolidar automaticamente
    const etapasPrincipais = ['landing', 'quiz_inicio', 'vsl', 'sales', 'checkout_iniciado'];
    
    etapasPrincipais.forEach(etapa => {
      if (!funilStats.etapas[etapa]) {
        funilStats.etapas[etapa] = {
          nome: etapa,
          visitantes: 0,
          conversoes: 0,
          taxa_conversao: 0,
          tempo_medio_segundos: 0
        };
      }
    });
    
    return {
      funil: funilStats,
      metricas_diarias: metricas,
      sessoes: sessoes.sessoes,
      resumo_hoje: metricas[getToday()] || null
    };
  }
}