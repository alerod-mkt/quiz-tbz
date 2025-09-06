import { db } from './db';
import { funilMetricas, metricasDiarias, sessoesAnonimas } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

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

interface MetricasDiariasData {
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
  id: string;
  session_id: number;
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

let proximoSessionId = 1;

export class MetricsCollectorDB {
  // Rastrear visitante em uma etapa específica
  static async trackVisitor(etapa: string): Promise<void> {
    try {
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

      // Atualizar métricas diárias
      await this.updateDailyMetrics();

    } catch (error) {
      console.error('Erro ao rastrear visitante:', error);
      throw error;
    }
  }

  // Rastrear conversão entre etapas
  static async trackConversion(etapaOrigem?: string, etapaDestino?: string): Promise<void> {
    try {
      if (!etapaDestino) return;

      // Incrementar conversões na etapa de destino
      const [existingEtapa] = await db
        .select()
        .from(funilMetricas)
        .where(eq(funilMetricas.etapa, etapaDestino))
        .limit(1);

      if (existingEtapa) {
        await db
          .update(funilMetricas)
          .set({
            conversoes: sql`${funilMetricas.conversoes} + 1`,
            taxa_conversao: sql`CASE WHEN ${funilMetricas.visitantes} > 0 THEN ((${funilMetricas.conversoes} + 1)::decimal / ${funilMetricas.visitantes}) * 100 ELSE 0 END`,
            ultima_atualizacao: new Date(),
          })
          .where(eq(funilMetricas.etapa, etapaDestino));
      } else {
        await db.insert(funilMetricas).values({
          etapa: etapaDestino,
          visitantes: 0,
          conversoes: 1,
          taxa_conversao: "0",
          tempo_medio_segundos: 0,
        });
      }

    } catch (error) {
      console.error('Erro ao rastrear conversão:', error);
      throw error;
    }
  }

  // Iniciar nova sessão
  static async startSession(): Promise<number> {
    try {
      const sessionId = proximoSessionId++;
      const hoje = getToday();
      const horaAtual = getCurrentHour();

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
      });

      return sessionId;
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      throw error;
    }
  }

  // Atualizar métricas diárias
  private static async updateDailyMetrics(): Promise<void> {
    try {
      const hoje = getToday();
      const horaAtual = getCurrentHour();

      // Buscar métricas existentes para hoje
      const [existingDay] = await db
        .select()
        .from(metricasDiarias)
        .where(eq(metricasDiarias.data, hoje))
        .limit(1);

      if (existingDay) {
        // Atualizar métricas existentes
        const horariosAtividade = { ...existingDay.horarios_atividade as any };
        horariosAtividade[horaAtual.toString().padStart(2, '0')] = (horariosAtividade[horaAtual.toString().padStart(2, '0')] || 0) + 1;

        await db
          .update(metricasDiarias)
          .set({
            visitantes_unicos: sql`${metricasDiarias.visitantes_unicos} + 1`,
            horarios_atividade: horariosAtividade,
            atualizado_em: new Date(),
          })
          .where(eq(metricasDiarias.data, hoje));
      } else {
        // Criar novo registro para hoje
        const horariosAtividade: any = {};
        for (let i = 0; i < 24; i++) {
          horariosAtividade[i.toString().padStart(2, '0')] = 0;
        }
        horariosAtividade[horaAtual.toString().padStart(2, '0')] = 1;

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
      console.error('Erro ao atualizar métricas diárias:', error);
    }
  }

  // Obter todas as métricas para o dashboard
  static async getDashboardMetrics(): Promise<{
    funil: FunilStats;
    metricas_diarias: MetricasDiariasData;
    sessoes: SessaoAnonima[];
    resumo_hoje: any;
  }> {
    try {
      // Buscar métricas do funil
      const funilData = await db.select().from(funilMetricas);
      
      const etapas: { [key: string]: MetricasEtapa } = {};
      funilData.forEach(item => {
        etapas[item.etapa] = {
          nome: item.etapa,
          visitantes: item.visitantes || 0,
          conversoes: item.conversoes || 0,
          taxa_conversao: parseFloat(item.taxa_conversao || "0"),
          tempo_medio_segundos: item.tempo_medio_segundos || 0,
        };
      });

      // Buscar métricas diárias
      const metricasDiariasData = await db.select().from(metricasDiarias);
      const metricas_diarias: MetricasDiariasData = {};
      
      metricasDiariasData.forEach(item => {
        metricas_diarias[item.data] = {
          data: item.data,
          visitantes_unicos: item.visitantes_unicos || 0,
          quiz_iniciados: item.quiz_iniciados || 0,
          quiz_completados: item.quiz_completados || 0,
          vsl_visualizacoes: item.vsl_visualizacoes || 0,
          sales_visualizacoes: item.sales_visualizacoes || 0,
          conversoes_compra: item.conversoes_compra || 0,
          taxa_conversao_geral: parseFloat(item.taxa_conversao_geral || "0"),
          tempo_medio_total: item.tempo_medio_total || 0,
          urgencia_critica: item.urgencia_critica || 0,
          urgencia_alta: item.urgencia_alta || 0,
          urgencia_moderada: item.urgencia_moderada || 0,
          horarios_atividade: item.horarios_atividade as any || {},
        };
      });

      // Buscar sessões
      const sessoesData = await db.select().from(sessoesAnonimas);
      const sessoes = sessoesData.map(item => ({
        id: item.id,
        session_id: item.session_id,
        timestamp_inicio: item.timestamp_inicio?.toISOString() || '',
        etapa_inicial: item.etapa_inicial,
        etapa_final: item.etapa_final,
        tempo_total_segundos: item.tempo_total_segundos || 0,
        perguntas_respondidas: item.perguntas_respondidas || 0,
        resultado_urgencia: item.resultado_urgencia || '',
        abandonou_em: item.abandonou_em,
        completou: item.completou || false,
        hora_acesso: item.hora_acesso,
        data_acesso: item.data_acesso,
      }));

      // Resumo de hoje
      const hoje = getToday();
      const resumo_hoje = metricas_diarias[hoje] || {
        data: hoje,
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

      return {
        funil: {
          etapas,
          ultima_atualizacao: new Date().toISOString(),
        },
        metricas_diarias,
        sessoes,
        resumo_hoje,
      };

    } catch (error) {
      console.error('Erro ao buscar métricas do dashboard:', error);
      throw error;
    }
  }

  // Resetar todas as métricas
  static async resetMetrics(): Promise<void> {
    try {
      await db.delete(funilMetricas);
      await db.delete(metricasDiarias);
      await db.delete(sessoesAnonimas);
      proximoSessionId = 1;
    } catch (error) {
      console.error('Erro ao resetar métricas:', error);
      throw error;
    }
  }
}