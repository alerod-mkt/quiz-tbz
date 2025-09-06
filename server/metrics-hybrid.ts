import { db } from './db';
import { funilMetricas, metricasDiarias, sessoesAnonimas, ipControlTable } from '@shared/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

// Sistema exclusivo PostgreSQL - sem fallback JSON

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

// Flag para controlar se PostgreSQL está disponível
let postgresAvailable = false;

// Testar e garantir conexão com PostgreSQL
async function testPostgresConnection() {
  try {
    // Criar tabelas se não existirem
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS funil_metricas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        etapa TEXT NOT NULL,
        visitantes INTEGER DEFAULT 0,
        conversoes INTEGER DEFAULT 0,
        tempo_total_segundos INTEGER DEFAULT 0,
        data_atualizacao TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS metricas_diarias (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        data DATE NOT NULL,
        visitantes_unicos INTEGER DEFAULT 0,
        quiz_iniciados INTEGER DEFAULT 0,
        quiz_completados INTEGER DEFAULT 0,
        vsl_visualizacoes INTEGER DEFAULT 0,
        sales_visualizacoes INTEGER DEFAULT 0,
        conversoes_compra INTEGER DEFAULT 0,
        taxa_conversao_geral DECIMAL(5,2) DEFAULT 0,
        tempo_medio_total INTEGER DEFAULT 0,
        urgencia_critica INTEGER DEFAULT 0,
        urgencia_alta INTEGER DEFAULT 0,
        urgencia_moderada INTEGER DEFAULT 0,
        horarios_atividade JSONB DEFAULT '{}',
        criado_em TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(data)
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessoes_anonimas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id INTEGER NOT NULL UNIQUE,
        timestamp_inicio TIMESTAMP DEFAULT NOW() NOT NULL,
        etapa_inicial TEXT NOT NULL,
        etapa_final TEXT NOT NULL,
        tempo_total_segundos INTEGER DEFAULT 0,
        perguntas_respondidas INTEGER DEFAULT 0,
        resultado_urgencia TEXT DEFAULT '',
        abandonou_em TEXT,
        completou BOOLEAN DEFAULT FALSE,
        hora_acesso INTEGER NOT NULL,
        data_acesso TEXT NOT NULL,
        ip_address TEXT DEFAULT '',
        criado_em TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await db.select().from(funilMetricas).limit(1);
    postgresAvailable = true;
    console.log('✅ PostgreSQL conectado e tabelas verificadas!');
    return true;
  } catch (error) {
    console.log('❌ ERRO CRÍTICO: PostgreSQL não disponível');
    console.log('Erro:', error instanceof Error ? error.message : String(error));
    postgresAvailable = false;
    throw new Error(`PostgreSQL connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Testar conexão na inicialização
testPostgresConnection().then(async () => {
  if (postgresAvailable) {
    // Criar tabela de controle de IP se não existir
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ip_control (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          ip_address TEXT NOT NULL,
          etapa TEXT NOT NULL,
          ultima_acao TIMESTAMP DEFAULT NOW() NOT NULL,
          criado_em TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ Tabela ip_control criada/verificada');
    } catch (error) {
      console.log('❌ Erro ao criar tabela ip_control:', error);
    }
  }
});

export class MetricsCollectorHybrid {
  
  // Verificar se IP já executou a ação nas últimas 24h
  static async checkIPDeduplication(ipAddress: string, etapa: string): Promise<boolean> {
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for IP deduplication');
    }
    
    try {
      const agora = new Date();
      const vinteCuatroHorasAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
      
      const [existingAction] = await db
        .select()
        .from(ipControlTable)
        .where(
          and(
            eq(ipControlTable.ip_address, ipAddress),
            eq(ipControlTable.etapa, etapa),
            gte(ipControlTable.ultima_acao, vinteCuatroHorasAtras)
          )
        )
        .limit(1);
      
      return !!existingAction; // Retorna true se já existe (duplicação)
    } catch (error) {
      console.error('Erro ao verificar deduplicação IP:', error);
      return false; // Em caso de erro, permite a ação
    }
  }
  
  // Registrar ação do IP para controle de deduplicação
  static async registerIPAction(ipAddress: string, etapa: string): Promise<void> {
    if (!postgresAvailable) return;
    
    try {
      await db.insert(ipControlTable).values({
        ip_address: ipAddress,
        etapa: etapa,
        ultima_acao: new Date(),
      });
    } catch (error) {
      console.error('Erro ao registrar ação IP:', error);
    }
  }

  // Rastrear visitante em uma etapa específica
  static async trackVisitor(etapa: string, ipAddress?: string): Promise<void> {
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for visitor tracking');
    }
    
    try {
      // Verificar deduplicação se IP foi fornecido
      if (ipAddress) {
        const isDuplicate = await this.checkIPDeduplication(ipAddress, etapa);
        if (isDuplicate) {
          console.log(`🛡️ IP ${ipAddress} já visitou ${etapa} nas últimas 24h - ignorando`);
          return;
        }
      }

      // Buscar ou criar registro da etapa
      const [existingEtapa] = await db
        .select()
        .from(funilMetricas)
        .where(eq(funilMetricas.etapa, etapa))
        .limit(1);

      if (existingEtapa) {
        // Incrementar visitantes
        await db
          .update(funilMetricas)
          .set({
            visitantes: sql`${funilMetricas.visitantes} + 1`,
            taxa_conversao: sql`CASE WHEN ${funilMetricas.visitantes} + 1 > 0 THEN (${funilMetricas.conversoes}::decimal / (${funilMetricas.visitantes} + 1)) * 100 ELSE 0 END`,
            ultima_atualizacao: new Date(),
          })
          .where(eq(funilMetricas.etapa, etapa));
      } else {
        // Criar nova etapa
        await db.insert(funilMetricas).values({
          etapa,
          visitantes: 1,
          conversoes: 0,
          taxa_conversao: "0",
          tempo_medio_segundos: 0,
        });
      }

      // Incrementar totais específicos baseados na etapa
      const hoje = this.getToday();
      if (etapa === 'quiz_inicio') {
        await this.incrementDailyMetric(hoje, 'quiz_iniciados');
        console.log('✅ Quiz iniciado incrementado nos totais');
      } else if (etapa === 'vsl') {
        await this.incrementDailyMetric(hoje, 'vsl_visualizacoes');
        console.log('✅ VSL visualização incrementada nos totais');
      } else if (etapa === 'sales') {
        await this.incrementDailyMetric(hoje, 'sales_visualizacoes');
        // Quando visita a página de vendas, marca quiz como completado
        await this.incrementDailyMetric(hoje, 'quiz_completados');
        console.log('✅ Sales visualização incrementada nos totais');
        console.log('✅ Quiz completado incrementado por chegada na página de vendas');
      } else if (etapa === 'checkout_iniciado') {
        await this.incrementDailyMetric(hoje, 'conversoes_compra');
        console.log('✅ Checkout iniciado incrementado nos totais');
      }
      
      // Registrar ação do IP para controle futuro
      if (ipAddress) {
        await this.registerIPAction(ipAddress, etapa);
      }
      
      // Atualizar métricas diárias de horário APENAS para landing page E apenas se passou na verificação de IP
      if (etapa === 'landing') {
        await this.updateDailyMetrics();
      }
    } catch (error) {
      console.log('❌ Erro PostgreSQL ao rastrear visitante');
      console.log('Erro:', error instanceof Error ? error.message : String(error));
      postgresAvailable = false;
      throw error;
    }
  }

  // Rastrear conversão entre etapas
  static async trackConversion(etapaOrigem?: string, etapaDestino?: string, ipAddress?: string): Promise<void> {
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for conversion tracking');
    }
    
    try {
      if (!etapaOrigem) return;

      // Verificar deduplicação por IP para conversões
      if (ipAddress) {
        const isDuplicate = await this.checkIPDeduplication(ipAddress, `conversion_${etapaOrigem}_${etapaDestino}`);
        if (isDuplicate) {
          console.log(`🚫 Conversão ${etapaOrigem}->${etapaDestino} já contabilizada para IP ${ipAddress} nas últimas 24h`);
          return;
        }
      }

      // CORREÇÃO: Incrementar conversões na etapa de ORIGEM (não destino)
      const [existingEtapa] = await db
        .select()
        .from(funilMetricas)
        .where(eq(funilMetricas.etapa, etapaOrigem))
        .limit(1);

      if (existingEtapa) {
        await db
          .update(funilMetricas)
          .set({
            conversoes: sql`${funilMetricas.conversoes} + 1`,
            taxa_conversao: sql`CASE WHEN ${funilMetricas.visitantes} > 0 THEN ((${funilMetricas.conversoes} + 1)::decimal / ${funilMetricas.visitantes}) * 100 ELSE 0 END`,
            ultima_atualizacao: new Date(),
          })
          .where(eq(funilMetricas.etapa, etapaOrigem));
        
        console.log(`✅ Conversão contabilizada na origem: ${etapaOrigem} -> ${etapaDestino}`);
      } else {
        await db.insert(funilMetricas).values({
          etapa: etapaOrigem,
          visitantes: 0,
          conversoes: 1,
          taxa_conversao: "0",
          tempo_medio_segundos: 0,
        });
        
        console.log(`✅ Nova etapa criada com conversão: ${etapaOrigem} -> ${etapaDestino}`);
      }

      // Registrar ação do IP para controle futuro
      if (ipAddress) {
        await this.registerIPAction(ipAddress, `conversion_${etapaOrigem}_${etapaDestino}`);
      }
    } catch (error) {
      console.log('❌ Erro PostgreSQL ao rastrear conversão');
      console.log('Erro:', error instanceof Error ? error.message : String(error));
      postgresAvailable = false;
      throw error;
    }
  }

  // Iniciar nova sessão
  static async startSession(ipAddress?: string): Promise<number> {
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for session tracking');
    }
    
    try {
      // Verificar se IP já iniciou sessão nas últimas 24h
      let shouldIncrementVisitor = true;
      if (ipAddress) {
        const isDuplicate = await this.checkIPDeduplication(ipAddress, 'session_start');
        if (isDuplicate) {
          console.log(`🛡️ IP ${ipAddress} já iniciou sessão nas últimas 24h - não incrementando visitante único`);
          shouldIncrementVisitor = false;
        }
      }

      // Gerar ID único baseado em timestamp para evitar duplicatas
      const sessionId = Date.now() % 100000;
      const hoje = this.getToday();
      const horaAtual = this.getCurrentHour();

      await db.insert(sessoesAnonimas).values({
        session_id: sessionId,
        etapa_inicial: 'landing',
        etapa_final: 'landing',
        tempo_total_segundos: 0,
        perguntas_respondidas: 0,
        resultado_urgencia: '',
        abandonou_em: null,
        completou: false,
        hora_acesso: horaAtual,
        data_acesso: hoje,
        ip_address: ipAddress || '',
      });

      // Incrementar visitante único apenas quando nova sessão é criada E IP não visitou antes
      if (shouldIncrementVisitor) {
        await this.incrementUniqueVisitor();
        
        // Registrar IP para controle futuro
        if (ipAddress) {
          await this.registerIPAction(ipAddress, 'session_start');
        }
      }

      return sessionId;
    } catch (error) {
      console.log('❌ Erro PostgreSQL ao criar sessão');
      console.log('Erro:', error instanceof Error ? error.message : String(error));
      postgresAvailable = false;
      throw error;
    }
  }

  // Incrementar visitante único (apenas quando há nova sessão)
  static async incrementUniqueVisitor(): Promise<void> {
    if (!postgresAvailable) return;

    try {
      const hoje = this.getToday();
      const horaAtual = this.getCurrentHour();

      // Buscar métricas existentes para hoje
      const [existingDay] = await db
        .select()
        .from(metricasDiarias)
        .where(eq(metricasDiarias.data, hoje))
        .limit(1);

      if (existingDay) {
        // Incrementar visitantes únicos
        await db
          .update(metricasDiarias)
          .set({
            visitantes_unicos: sql`${metricasDiarias.visitantes_unicos} + 1`,
            atualizado_em: new Date(),
          })
          .where(eq(metricasDiarias.data, hoje));
      } else {
        // Criar novo registro para hoje com 1 visitante único
        const horariosAtividade: any = {};
        for (let i = 0; i < 24; i++) {
          horariosAtividade[i.toString().padStart(2, '0')] = 0;
        }
        // NÃO incrementar horário aqui - será feito em updateDailyMetrics()

        await db.insert(metricasDiarias).values({
          data: hoje,
          visitantes_unicos: 1,
          quiz_iniciados: 0,
          quiz_completados: 0,
          vsl_visualizacoes: 0,
          sales_visualizacoes: 0,
          conversoes_compra: 0,
          taxa_conversao_geral: "0",
          tempo_medio_total: 0,
          urgencia_critica: 0,
          urgencia_alta: 0,
          urgencia_moderada: 0,
          horarios_atividade: horariosAtividade,
        });
      }
    } catch (error) {
      console.error('Erro ao incrementar visitante único:', error);
    }
  }

  // Obter data de hoje no formato YYYY-MM-DD
  private static getToday(): string {
    // Usar fuso horário de São Paulo (UTC-3)
    const now = new Date();
    const saoPauloOffset = -3 * 60; // UTC-3 em minutos
    const saoPauloTime = new Date(now.getTime() + (saoPauloOffset * 60 * 1000));
    return saoPauloTime.toISOString().split('T')[0];
  }

  // Obter hora atual (0-23) usando fuso horário de São Paulo (UTC-3)
  private static getCurrentHour(): number {
    const now = new Date();
    const saoPauloOffset = -3 * 60; // UTC-3 em minutos
    const saoPauloTime = new Date(now.getTime() + (saoPauloOffset * 60 * 1000));
    return saoPauloTime.getHours();
  }

  // Calcular etapas do funil baseadas nas sessões do período
  private static calcularEtapasPorSessoes(sessoesPeriodo: any[], etapasBase: { [key: string]: MetricasEtapa }): { [key: string]: MetricasEtapa } {
    // Se não há sessões no período, retornar etapas vazias
    if (sessoesPeriodo.length === 0) {
      const etapasVazias: { [key: string]: MetricasEtapa } = {};
      Object.keys(etapasBase).forEach(etapa => {
        etapasVazias[etapa] = {
          nome: etapa,
          visitantes: 0,
          conversoes: 0,
          taxa_conversao: 0,
          tempo_medio_segundos: 0,
        };
      });
      return etapasVazias;
    }

    // Contar visitantes e conversões por etapa baseado nas sessões
    const contadores: { [key: string]: { visitantes: number; conversoes: number } } = {};
    
    // Inicializar contadores para todas as etapas conhecidas
    Object.keys(etapasBase).forEach(etapa => {
      contadores[etapa] = { visitantes: 0, conversoes: 0 };
    });

    // Analisar cada sessão para contar visitantes e conversões
    sessoesPeriodo.forEach(sessao => {
      // Landing - toda sessão começa na landing
      contadores['landing'] = contadores['landing'] || { visitantes: 0, conversoes: 0 };
      contadores['landing'].visitantes += 1;
      
      // Se avançou da landing, conta como conversão
      if (sessao.etapa_final !== 'landing') {
        contadores['landing'].conversoes += 1;
      }

      // Quiz início - se chegou ao quiz
      if (sessao.etapa_final === 'quiz_completado' || sessao.etapa_final === 'checkout_iniciado' || sessao.perguntas_respondidas > 0) {
        contadores['quiz_inicio'] = contadores['quiz_inicio'] || { visitantes: 0, conversoes: 0 };
        contadores['quiz_inicio'].visitantes += 1;
        
        // Se completou o quiz, conta como conversão
        if (sessao.completou) {
          contadores['quiz_inicio'].conversoes += 1;
        }
      }

      // VSL - se chegou na VSL (etapa após quiz)
      if (sessao.etapa_final === 'checkout_iniciado') {
        contadores['vsl'] = contadores['vsl'] || { visitantes: 0, conversoes: 0 };
        contadores['vsl'].visitantes += 1;
        contadores['vsl'].conversoes += 1; // Se chegou ao checkout, passou pela VSL
      }

      // Sales - se chegou nas vendas  
      if (sessao.etapa_final === 'checkout_iniciado') {
        contadores['sales'] = contadores['sales'] || { visitantes: 0, conversoes: 0 };
        contadores['sales'].visitantes += 1;
        contadores['sales'].conversoes += 1; // Chegou ao checkout = conversão de sales
      }
    });

    // Converter contadores em formato esperado
    const etapasCalculadas: { [key: string]: MetricasEtapa } = {};
    Object.keys(contadores).forEach(etapa => {
      const contador = contadores[etapa];
      etapasCalculadas[etapa] = {
        nome: etapa,
        visitantes: contador.visitantes,
        conversoes: contador.conversoes,
        taxa_conversao: contador.visitantes > 0 ? (contador.conversoes / contador.visitantes) * 100 : 0,
        tempo_medio_segundos: 0, // Pode ser calculado se necessário
      };
    });

    return etapasCalculadas;
  }

  // Helper para incrementar métricas diárias específicas
  private static async incrementDailyMetric(data: string, campo: string): Promise<void> {
    try {
      const [existing] = await db
        .select()
        .from(metricasDiarias)
        .where(eq(metricasDiarias.data, data))
        .limit(1);

      if (existing) {
        await db
          .update(metricasDiarias)
          .set({
            [campo]: sql`${metricasDiarias[campo as keyof typeof metricasDiarias]} + 1`,
            atualizado_em: new Date(),
          })
          .where(eq(metricasDiarias.data, data));
      } else {
        const newRecord: any = {
          data,
          visitantes_unicos: campo === 'visitantes_unicos' ? 1 : 0,
          quiz_iniciados: campo === 'quiz_iniciados' ? 1 : 0,
          quiz_completados: campo === 'quiz_completados' ? 1 : 0,
          vsl_visualizacoes: campo === 'vsl_visualizacoes' ? 1 : 0,
          sales_visualizacoes: campo === 'sales_visualizacoes' ? 1 : 0,
          conversoes_compra: campo === 'conversoes_compra' ? 1 : 0,
          taxa_conversao_geral: "0",
          tempo_medio_total: 0,
          urgencia_critica: campo === 'urgencia_critica' ? 1 : 0,
          urgencia_alta: campo === 'urgencia_alta' ? 1 : 0,
          urgencia_moderada: campo === 'urgencia_moderada' ? 1 : 0,
          horarios_atividade: {},
        };
        await db.insert(metricasDiarias).values(newRecord);
      }
    } catch (error) {
      console.error(`Erro ao incrementar ${campo}:`, error);
    }
  }

  // Atualizar métricas diárias com atividade por horário
  static async updateDailyMetrics(): Promise<void> {
    if (!postgresAvailable) return;

    try {
      const hoje = this.getToday();
      const horaAtual = this.getCurrentHour();

      const [existingDay] = await db
        .select()
        .from(metricasDiarias)
        .where(eq(metricasDiarias.data, hoje))
        .limit(1);

      if (existingDay) {
        const horariosAtividade: any = existingDay.horarios_atividade || {};
        const horaStr = horaAtual.toString().padStart(2, '0');
        horariosAtividade[horaStr] = (horariosAtividade[horaStr] || 0) + 1;

        await db
          .update(metricasDiarias)
          .set({
            horarios_atividade: horariosAtividade,
          })
          .where(eq(metricasDiarias.data, hoje));
      }
    } catch (error) {
      console.error('Erro ao atualizar métricas diárias:', error);
    }
  }

  // Obter métricas do dashboard
  static async getDashboardMetrics(periodo?: string, dataEspecifica?: string, dataInicio?: string, dataFim?: string): Promise<any> {
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for dashboard metrics');
    }

    try {
      
      // Buscar dados do funil (sempre buscar todos para ter base de comparação)
      const funilData = await db.select().from(funilMetricas);
      
      // Transformar em formato base
      const etapasBase: { [key: string]: MetricasEtapa } = {};
      funilData.forEach(item => {
        etapasBase[item.etapa] = {
          nome: item.etapa,
          visitantes: item.visitantes,
          conversoes: item.conversoes,
          taxa_conversao: parseFloat(item.taxa_conversao),
          tempo_medio_segundos: item.tempo_medio_segundos,
        };
      });

      // Buscar métricas diárias
      const metricasDiariasData = await db.select().from(metricasDiarias);
      
      const metricasDiariasObj: any = {};
      metricasDiariasData.forEach(item => {
        metricasDiariasObj[item.data] = item;
      });

      // Buscar sessões
      const sessoes = await db.select().from(sessoesAnonimas);

      // Determinar data de referência baseado no filtro
      let dataReferencia: string;
      let resumo_periodo: any = {
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
        horarios_atividade: {},
      };
      
      if (periodo === 'data_especifica' && dataEspecifica) {
        // Data específica
        dataReferencia = dataEspecifica;
        resumo_periodo = metricasDiariasObj[dataEspecifica] || resumo_periodo;
      } else if (periodo === 'ontem') {
        // Ontem usando fuso horário de São Paulo (UTC-3)
        const now = new Date();
        const saoPauloOffset = -3 * 60; // UTC-3 em minutos
        const saoPauloTime = new Date(now.getTime() + (saoPauloOffset * 60 * 1000));
        const ontem = new Date(saoPauloTime.getTime() - 24 * 60 * 60 * 1000);
        dataReferencia = ontem.toISOString().split('T')[0];
        resumo_periodo = metricasDiariasObj[dataReferencia] || resumo_periodo;
      } else if (periodo === 'semana') {
        // Última semana - somar dados dos últimos 7 dias usando fuso horário de São Paulo (UTC-3)
        const now = new Date();
        const saoPauloOffset = -3 * 60; // UTC-3 em minutos
        const hoje = new Date(now.getTime() + (saoPauloOffset * 60 * 1000));
        for (let i = 0; i < 7; i++) {
          const data = new Date(hoje.getTime() - (i * 24 * 60 * 60 * 1000));
          const dataStr = data.toISOString().split('T')[0];
          const dadosDia = metricasDiariasObj[dataStr];
          if (dadosDia) {
            resumo_periodo.visitantes_unicos += dadosDia.visitantes_unicos || 0;
            resumo_periodo.quiz_iniciados += dadosDia.quiz_iniciados || 0;
            resumo_periodo.quiz_completados += dadosDia.quiz_completados || 0;
            resumo_periodo.vsl_visualizacoes += dadosDia.vsl_visualizacoes || 0;
            resumo_periodo.sales_visualizacoes += dadosDia.sales_visualizacoes || 0;
            resumo_periodo.conversoes_compra += dadosDia.conversoes_compra || 0;
            resumo_periodo.urgencia_critica += dadosDia.urgencia_critica || 0;
            resumo_periodo.urgencia_alta += dadosDia.urgencia_alta || 0;
            resumo_periodo.urgencia_moderada += dadosDia.urgencia_moderada || 0;
            
            // Agregar horários de atividade
            if (dadosDia.horarios_atividade) {
              Object.entries(dadosDia.horarios_atividade as any).forEach(([hora, atividade]) => {
                resumo_periodo.horarios_atividade[hora] = (resumo_periodo.horarios_atividade[hora] || 0) + (atividade as number);
              });
            }
          }
        }
        dataReferencia = 'semana';
      } else if (periodo === 'faixa_data' && dataInicio && dataFim) {
        // Faixa de data - somar dados entre as datas especificadas
        const dataInicioDate = new Date(dataInicio);
        const dataFimDate = new Date(dataFim);
        
        // Iterar sobre todas as datas no intervalo
        for (let d = new Date(dataInicioDate); d <= dataFimDate; d.setDate(d.getDate() + 1)) {
          const dataStr = d.toISOString().split('T')[0];
          const dadosDia = metricasDiariasObj[dataStr];
          if (dadosDia) {
            resumo_periodo.visitantes_unicos += dadosDia.visitantes_unicos || 0;
            resumo_periodo.quiz_iniciados += dadosDia.quiz_iniciados || 0;
            resumo_periodo.quiz_completados += dadosDia.quiz_completados || 0;
            resumo_periodo.vsl_visualizacoes += dadosDia.vsl_visualizacoes || 0;
            resumo_periodo.sales_visualizacoes += dadosDia.sales_visualizacoes || 0;
            resumo_periodo.conversoes_compra += dadosDia.conversoes_compra || 0;
            resumo_periodo.urgencia_critica += dadosDia.urgencia_critica || 0;
            resumo_periodo.urgencia_alta += dadosDia.urgencia_alta || 0;
            resumo_periodo.urgencia_moderada += dadosDia.urgencia_moderada || 0;
            
            // Agregar horários de atividade
            if (dadosDia.horarios_atividade) {
              Object.entries(dadosDia.horarios_atividade as any).forEach(([hora, atividade]) => {
                resumo_periodo.horarios_atividade[hora] = (resumo_periodo.horarios_atividade[hora] || 0) + (atividade as number);
              });
            }
          }
        }
        dataReferencia = `${dataInicio}_${dataFim}`;
      } else {
        // Hoje (padrão)
        const hoje = this.getToday();
        dataReferencia = hoje;
        resumo_periodo = metricasDiariasObj[hoje] || resumo_periodo;
      }

      // Estratégia inteligente: usar dados do funil base (que tem granularidade) 
      // quando há atividade no período, zeros quando não há
      let etapas: { [key: string]: MetricasEtapa } = {};
      
      const temDadosNoPeriodo = resumo_periodo.visitantes_unicos > 0 || 
                               resumo_periodo.quiz_iniciados > 0 || 
                               resumo_periodo.quiz_completados > 0;
      
      
      if (temDadosNoPeriodo) {
        // Se há dados no período, usar dados acumulados do funil (etapasBase)
        // porque contém dados granulares das perguntas individuais e conversões detalhadas
        etapas = { ...etapasBase };
        console.log(`📊 Usando dados acumulados do funil pois há atividade no período ${periodo}`);
      } else {
        // Se não há dados no período, mostrar todas as etapas como zero
        Object.keys(etapasBase).forEach(etapa => {
          etapas[etapa] = {
            nome: etapa,
            visitantes: 0,
            conversoes: 0,
            taxa_conversao: 0,
            tempo_medio_segundos: 0
          };
        });
        console.log(`📊 Mostrando zeros para período ${periodo} (sem atividade)`);
      }

      // Initiate Checkout = conversões da página de vendas (do período filtrado)
      const initiateCheckouts = etapas['sales']?.conversoes || 0;
      console.log(`📊 Calculando initiate_checkouts: sales conversoes = ${initiateCheckouts}`);
      

      return {
        funil: {
          etapas,
          ultima_atualizacao: new Date().toISOString(),
        },
        metricas_diarias: metricasDiariasObj,
        sessoes,
        resumo_hoje: {
          ...resumo_periodo,
          initiate_checkouts: initiateCheckouts
        },
        database_status: 'postgresql'
      };

    } catch (error) {
      console.log('❌ Erro PostgreSQL ao obter métricas do dashboard');
      console.log('Erro:', error instanceof Error ? error.message : String(error));
      postgresAvailable = false;
      throw error;
    }
  }

  // Resetar todas as métricas
  static async resetMetrics(): Promise<void> {
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for metrics reset');
    }
    
    try {
      await db.delete(funilMetricas);
      await db.delete(metricasDiarias);
      await db.delete(sessoesAnonimas);
    } catch (error) {
      console.log('❌ Erro PostgreSQL ao resetar métricas');
      console.log('Erro:', error instanceof Error ? error.message : String(error));
      postgresAvailable = false;
      throw error;
    }
  }

  // Resetar apenas os horários de atividade
  static async resetHorariosAtividade(): Promise<void> {
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for hourly reset');
    }

    try {
      await db
        .update(metricasDiarias)
        .set({
          horarios_atividade: {}
        });
      console.log('✅ Horários de atividade foram resetados');
    } catch (error) {
      console.log('❌ Erro PostgreSQL ao resetar horários');
      console.log('Erro:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Rastrear abandono por inatividade ou fechamento de página
  static async trackAbandono(sessionId: number, etapa: string, tipo: 'inatividade' | 'fechamento'): Promise<void> {
    console.log(`⚠️ trackAbandono: sessionId=${sessionId}, etapa=${etapa}, tipo=${tipo}, postgresAvailable=${postgresAvailable}`);
    
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for abandono tracking');
    }

    try {
      // Atualizar sessão marcando como abandonada
      await db
        .update(sessoesAnonimas)
        .set({
          abandonou_em: etapa,
          completou: false,
        })
        .where(eq(sessoesAnonimas.session_id, sessionId));

      console.log(`✅ Abandono registrado: ${tipo} na etapa ${etapa}`);
    } catch (error) {
      console.log('❌ Erro PostgreSQL ao rastrear abandono');
      console.log('Erro:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Tentar reconectar PostgreSQL
  static async retryPostgresConnection(): Promise<boolean> {
    return await testPostgresConnection();
  }

  // Rastrear quiz completado
  static async trackQuizCompleted(sessionId: number, urgencia: string): Promise<void> {
    console.log(`🎯 trackQuizCompleted: sessionId=${sessionId}, urgencia=${urgencia}, postgresAvailable=${postgresAvailable}`);
    
    // Tentar reconectar se necessário
    if (!postgresAvailable) {
      await testPostgresConnection();
    }
    
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for quiz completion tracking');
    }

    try {
      // Atualizar sessão
      await db
        .update(sessoesAnonimas)
        .set({
          etapa_final: 'quiz_completado',
          completou: true,
          resultado_urgencia: urgencia,
        })
        .where(eq(sessoesAnonimas.session_id, sessionId));

      console.log('✅ Sessão atualizada para quiz_completado');

      // Incrementar quiz completados nas métricas diárias
      const hoje = this.getToday();
      await this.incrementDailyMetric(hoje, 'quiz_completados');
      console.log('✅ Quiz completados incrementado');

      // Incrementar urgência baseada no resultado
      if (urgencia === 'HIGH_URGENCY') {
        await this.incrementDailyMetric(hoje, 'urgencia_critica');
        console.log('✅ Urgência crítica incrementada');
      } else if (urgencia === 'MEDIUM_URGENCY') {
        await this.incrementDailyMetric(hoje, 'urgencia_alta');
        console.log('✅ Urgência alta incrementada');
      } else {
        await this.incrementDailyMetric(hoje, 'urgencia_moderada');
        console.log('✅ Urgência moderada incrementada');
      }
    } catch (error) {
      console.log('❌ Erro PostgreSQL ao rastrear quiz completado');
      console.log('Erro:', error instanceof Error ? error.message : String(error));
      postgresAvailable = false;
      throw error;
    }
  }

  // Remover IP específico do controle de deduplicação
  static async removeIpFromControl(ipAddress: string): Promise<void> {
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for IP removal');
    }
    
    try {
      await db.delete(ipControlTable).where(eq(ipControlTable.ip_address, ipAddress));
      console.log(`🗑️ IP ${ipAddress} removido do controle de deduplicação`);
    } catch (error) {
      console.error('Erro ao remover IP do controle:', error);
      throw error;
    }
  }

  // Rastrear checkout iniciado
  static async trackPurchase(sessionId: number): Promise<void> {
    console.log(`🛒 trackPurchase: sessionId=${sessionId}, postgresAvailable=${postgresAvailable}`);
    
    // Tentar reconectar se necessário
    if (!postgresAvailable) {
      await testPostgresConnection();
    }
    
    if (!postgresAvailable) {
      throw new Error('PostgreSQL not available for purchase tracking');
    }

    try {
      // Atualizar sessão
      await db
        .update(sessoesAnonimas)
        .set({
          etapa_final: 'checkout_iniciado',
        })
        .where(eq(sessoesAnonimas.session_id, sessionId));

      console.log('✅ Sessão atualizada para checkout_iniciado');

      // Incrementar conversões de compra nas métricas diárias
      const hoje = this.getToday();
      await this.incrementDailyMetric(hoje, 'conversoes_compra');
      console.log('✅ Conversões de compra incrementadas');
      console.log('✅ Checkout iniciado registrado no banco');
    } catch (error) {
      console.log('❌ Erro PostgreSQL ao rastrear checkout iniciado');
      console.log('Erro:', error instanceof Error ? error.message : String(error));
      postgresAvailable = false;
      throw error;
    }
  }
}