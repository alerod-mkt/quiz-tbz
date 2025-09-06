import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import logoReino360 from '@assets/logo reino 360_1756825083353.png';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Clock, 
  Download,
  RefreshCw,
  Filter,
  Calendar,
  PieChart,
  Activity,
  BarChart2,
  TrendingDown,
  RotateCcw,
  ChevronDown,
  ShoppingCart
} from 'lucide-react';
import { QUIZ_QUESTIONS } from '@/types/quiz';
import { FunilChart, UrgenciaChart, TimelineChart, HeatmapChart, AbandonoChart } from '@/components/DashboardCharts';
import { ExportOptions } from '@/pages/DashboardExport';

import Untitled_design from "@assets/Untitled design.png";

interface DashboardMetrics {
  funil: {
    etapas: { [key: string]: {
      nome: string;
      visitantes: number;
      conversoes: number;
      taxa_conversao: number;
      tempo_medio_segundos: number;
    }};
  };
  metricas_diarias: { [date: string]: {
    data: string;
    visitantes_unicos: number;
    quiz_iniciados: number;
    quiz_completados: number;
    vsl_visualizacoes: number;
    sales_visualizacoes: number;
    conversoes_compra: number;
    taxa_conversao_geral: number;
    urgencia_critica: number;
    urgencia_alta: number;
    urgencia_moderada: number;
    horarios_atividade: { [hora: string]: number };
  }};
  sessoes: Array<{
    id: number;
    etapa_inicial: string;
    etapa_final: string;
    completou: boolean;
    resultado_urgencia: string;
    data_acesso: string;
  }>;
  resumo_hoje: any;
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [filtroData, setFiltroData] = useState('hoje');
  const [dataEspecifica, setDataEspecifica] = useState(''); // Usar semana como padrão para sempre mostrar dados
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(2);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRemoveIpModal, setShowRemoveIpModal] = useState(false);
  const [ipToRemove, setIpToRemove] = useState('');
  const [showResetHorariosConfirm, setShowResetHorariosConfirm] = useState(false);

  // Query para buscar métricas
  const { data: metrics, refetch, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics', filtroData, dataEspecifica, dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        periodo: filtroData,
        ...(filtroData === 'data_especifica' && dataEspecifica && { data_especifica: dataEspecifica }),
        ...(filtroData === 'faixa_data' && dataInicio && dataFim && { data_inicio: dataInicio, data_fim: dataFim })
      });
      console.log('🔍 Fazendo request com parâmetros:', { periodo: filtroData, data_especifica: dataEspecifica, data_inicio: dataInicio, data_fim: dataFim });
      const response = await fetch(`/api/dashboard/metrics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      return response.json();
    },
    enabled: isAuthenticated && (
      filtroData === 'hoje' || filtroData === 'ontem' || filtroData === 'semana' ||
      (filtroData === 'data_especifica' && dataEspecifica !== '') ||
      (filtroData === 'faixa_data' && dataInicio !== '' && dataFim !== '')
    ),
    refetchInterval: 5000, // Atualizar a cada 5 segundos (mais estável)
    refetchOnWindowFocus: false, // Evitar requests extras ao focar na janela
    staleTime: 1000, // Cache reduzido para aplicar filtros mais rápido
  });

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  // Função para resetar métricas
  const handleResetMetrics = async () => {
    try {
      await apiRequest('POST', '/api/metrics/reset');
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      setShowResetConfirm(false);
      alert('Métricas resetadas com sucesso!');
    } catch (error) {
      console.error('Erro ao resetar métricas:', error);
      alert('Erro ao resetar métricas. Tente novamente.');
    }
  };

  // Função para remover IP específico
  const handleRemoveIp = async () => {
    if (!ipToRemove.trim()) {
      alert('Por favor, insira um IP válido');
      return;
    }

    try {
      await apiRequest('POST', '/api/metrics/remove-ip', { ipAddress: ipToRemove.trim() });
      setShowRemoveIpModal(false);
      setIpToRemove('');
      alert(`IP ${ipToRemove.trim()} removido com sucesso!`);
    } catch (error) {
      console.error('Erro ao remover IP:', error);
      alert('Erro ao remover IP. Tente novamente.');
    }
  };

  // Função para resetar horários de atividade
  const handleResetHorarios = async () => {
    try {
      await apiRequest('POST', '/api/metrics/reset-horarios');
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      setShowResetHorariosConfirm(false);
      alert('Horários de atividade resetados com sucesso!');
    } catch (error) {
      console.error('Erro ao resetar horários:', error);
      alert('Erro ao resetar horários. Tente novamente.');
    }
  };

  const filtrarMetricasPorData = (filtro: string) => {
    if (!metrics) return metrics;

    // Usar fuso horário de São Paulo (UTC-3)
    const now = new Date();
    const saoPauloOffset = -3 * 60; // UTC-3 em minutos
    const saoPauloTime = new Date(now.getTime() + (saoPauloOffset * 60 * 1000));
    
    const hoje = saoPauloTime.toISOString().split('T')[0];
    const ontem = new Date(saoPauloTime.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const seteDiasAtras = new Date(saoPauloTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Aplicar filtros de data tanto aos cards quanto ao funil para consistência
    let metricasFiltradas = { ...metrics };

    if (filtro === 'ontem') {
      // Mostrar métricas de ontem
      const resumoOntem = metrics.metricas_diarias[ontem] || {
        visitantes_unicos: 0,
        quiz_iniciados: 0,
        quiz_completados: 0,
        conversoes_compra: 0,
        urgencia_critica: 0,
        urgencia_alta: 0,
        urgencia_moderada: 0,
        taxa_conversao_geral: 0,
        horarios_atividade: {}
      };
      metricasFiltradas.resumo_hoje = resumoOntem;
      
      // Filtrar funil para mostrar apenas dados de ontem (se houver)
      metricasFiltradas.funil = {
        etapas: {} // Funil vazio para ontem, já que métricas históricas por etapa não são armazenadas por data
      };
    } else if (filtro === 'semana') {
      // Agregar dados da última semana
      const metricasSemana = Object.entries(metrics.metricas_diarias)
        .filter(([data]) => data >= seteDiasAtras && data <= hoje)
        .reduce((acc, [_, metricas]: [string, any]) => ({
          visitantes_unicos: (acc.visitantes_unicos || 0) + (metricas.visitantes_unicos || 0),
          quiz_iniciados: (acc.quiz_iniciados || 0) + (metricas.quiz_iniciados || 0),
          quiz_completados: (acc.quiz_completados || 0) + (metricas.quiz_completados || 0),
          conversoes_compra: (acc.conversoes_compra || 0) + (metricas.conversoes_compra || 0),
          urgencia_critica: (acc.urgencia_critica || 0) + (metricas.urgencia_critica || 0),
          urgencia_alta: (acc.urgencia_alta || 0) + (metricas.urgencia_alta || 0),
          urgencia_moderada: (acc.urgencia_moderada || 0) + (metricas.urgencia_moderada || 0),
          taxa_conversao_geral: 0, // Será recalculado
          horarios_atividade: {}
        }), {
          visitantes_unicos: 0,
          quiz_iniciados: 0,
          quiz_completados: 0,
          conversoes_compra: 0,
          urgencia_critica: 0,
          urgencia_alta: 0,
          urgencia_moderada: 0,
          taxa_conversao_geral: 0,
          horarios_atividade: {}
        });
      
      metricasSemana.taxa_conversao_geral = metricasSemana.visitantes_unicos > 0 
        ? (metricasSemana.quiz_completados / metricasSemana.visitantes_unicos) * 100 
        : 0;
      
      metricasFiltradas.resumo_hoje = metricasSemana;
      
      // Para semana, manter o funil atual já que representa dados acumulados recentes
      // No futuro, funil deveria ser filtrado por período quando backend suportar
    } else if (filtro !== 'hoje') {
      // Para outros filtros (data específica, faixa), zerar funil até implementarmos filtro por período no backend
      metricasFiltradas.funil = {
        etapas: {}
      };
    }
    // Para 'hoje' não precisa fazer nada, usar os dados originais

    return metricasFiltradas;
  };

  const metricsFiltered = filtrarMetricasPorData(filtroData);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Administrativo</h1>
            <p className="text-gray-600">Quiz - Família Resgatada</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite a senha..."
                data-testid="password-input"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              data-testid="login-button"
            >
              Acessar Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const resumoHoje = metricsFiltered?.resumo_hoje || {
    visitantes_unicos: 0,
    quiz_iniciados: 0,
    quiz_completados: 0,
    conversoes_compra: 0,
    taxa_conversao_geral: 0,
    urgencia_critica: 0,
    urgencia_alta: 0,
    urgencia_moderada: 0,
    horarios_atividade: {}
  };

  // Garantir que todas as propriedades existem
  const resumoSeguro = {
    visitantes_unicos: resumoHoje.visitantes_unicos || 0,
    quiz_iniciados: resumoHoje.quiz_iniciados || 0,
    quiz_completados: resumoHoje.quiz_completados || 0,
    conversoes_compra: resumoHoje.conversoes_compra || 0,
    taxa_conversao_geral: resumoHoje.taxa_conversao_geral || 0,
    urgencia_critica: resumoHoje.urgencia_critica || 0,
    urgencia_alta: resumoHoje.urgencia_alta || 0,
    urgencia_moderada: resumoHoje.urgencia_moderada || 0,
    horarios_atividade: resumoHoje.horarios_atividade || {},
    initiate_checkouts: (resumoHoje as any).initiate_checkouts || 0
  };
  
  // Calcular taxa de conversão: Initiate Checkout / Visitantes
  const initiateCheckouts = (resumoSeguro as any).initiate_checkouts || 0;
  const taxaConversao = resumoSeguro.visitantes_unicos > 0 
    ? (initiateCheckouts / resumoSeguro.visitantes_unicos) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          {/* Logo Reino 360 - Centralizado */}
          <div className="flex justify-center mb-6">
            <img 
              src={Untitled_design} 
              alt="Reino 360" 
              className="h-16 object-contain ml-[0px] mr-[0px] pl-[0px] pr-[0px] pt-[0px] pb-[0px] mt-[0px] mb-[0px]"
            />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel do Quiz</h1>
              <p className="text-gray-600">Métricas e Analytics - TBZ</p>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              {/* Filtro de Data */}
              <select
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="date-filter"
              >
                <option value="hoje">Hoje</option>
                <option value="ontem">Ontem</option>
                <option value="semana">Última Semana</option>
                <option value="data_especifica">Data Específica</option>
                <option value="faixa_data">Faixa de Data</option>
              </select>
              
              {/* Seletor de Data Específica */}
              {filtroData === 'data_especifica' && (
                <input
                  type="date"
                  value={dataEspecifica}
                  onChange={(e) => {
                    setDataEspecifica(e.target.value);
                    // Refetch automaticamente quando data for selecionada
                    if (e.target.value) {
                      setTimeout(() => refetch(), 100);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="specific-date-input"
                />
              )}
              
              {/* Seletor de Faixa de Data */}
              {filtroData === 'faixa_data' && (
                <>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => {
                      setDataInicio(e.target.value);
                      // Refetch automaticamente quando ambas as datas estiverem preenchidas
                      if (e.target.value && dataFim) {
                        setTimeout(() => refetch(), 100);
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Data Início"
                    data-testid="start-date-input"
                  />
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => {
                      setDataFim(e.target.value);
                      // Refetch automaticamente quando ambas as datas estiverem preenchidas
                      if (dataInicio && e.target.value) {
                        setTimeout(() => refetch(), 100);
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Data Fim"
                    data-testid="end-date-input"
                  />
                </>
              )}

              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                data-testid="refresh-button"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                data-testid="export-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              
              <button
                onClick={() => setShowRemoveIpModal(true)}
                className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                data-testid="remove-ip-button"
              >
                <Users className="w-4 h-4 mr-2" />
                Remover IP
              </button>

              <button
                onClick={() => setShowResetHorariosConfirm(true)}
                className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                data-testid="reset-horarios-button"
              >
                <Clock className="w-4 h-4 mr-2" />
                Zerar Horários
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                data-testid="reset-button"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Zerar Leads
              </button>
            </div>
          </div>
        </motion.div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <MetricCard
            titulo="Total de Visitantes"
            valor={resumoSeguro.visitantes_unicos}
            icone={<Users className="w-8 h-8" />}
            cor="blue"
            data-testid="visitors-card"
          />
          
          <MetricCard
            titulo="Quiz Iniciados"
            valor={resumoSeguro.quiz_iniciados}
            icone={<Target className="w-8 h-8" />}
            cor="green"
            data-testid="quiz-started-card"
          />
          
          <MetricCard
            titulo="Quiz Completados"
            valor={resumoSeguro.quiz_completados}
            icone={<TrendingUp className="w-8 h-8" />}
            cor="purple"
            data-testid="quiz-completed-card"
          />
          
          <MetricCard
            titulo="Iniciou Checkout"
            valor={resumoSeguro.initiate_checkouts}
            icone={<ShoppingCart className="w-8 h-8" />}
            cor="indigo"
            data-testid="checkout-started-card"
          />

          <MetricCard
            titulo="Taxa Conversão"
            valor={`${taxaConversao.toFixed(1)}%`}
            icone={<BarChart3 className="w-8 h-8" />}
            cor="orange"
            data-testid="conversion-rate-card"
          />
        </div>

        {/* Funil de Conversão */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Activity className="w-6 h-6 mr-2" />
            Funil de Conversão
          </h2>
          
          <div className="space-y-4">
            {/* Página Inicial */}
            {(() => {
              const data = metrics?.funil.etapas['landing'] || {
                visitantes: 0,
                conversoes: 0,
                taxa_conversao: 0
              };
              
              return (
                <FunilEtapa
                  key="landing"
                  etapa="Página Inicial"
                  visitantes={data.visitantes}
                  conversoes={data.conversoes}
                  taxa={data.taxa_conversao}
                />
              );
            })()}
            
            {/* Iniciou o Quiz */}
            {(() => {
              const data = metrics?.funil.etapas['quiz_inicio'] || {
                visitantes: 0,
                conversoes: 0,
                taxa_conversao: 0
              };
              
              return (
                <FunilEtapa
                  key="quiz_inicio"
                  etapa="Iniciou o Quiz"
                  visitantes={data.visitantes}
                  conversoes={data.conversoes}
                  taxa={data.taxa_conversao}
                />
              );
            })()}
            
            {/* Seção de Perguntas com Dropdown - Logo após Iniciou o Quiz */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Perguntas do Quiz</h3>
                <div className="relative">
                  <select
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8"
                    data-testid="question-selector"
                  >
                    {/* Perguntas 2-15 (já que pergunta 1 é "Iniciou o Quiz") */}
                    {QUIZ_QUESTIONS.slice(1).map((question) => (
                      <option key={question.id} value={question.id}>
                        Pergunta {question.id}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-3 text-gray-500 pointer-events-none" />
                </div>
              </div>
              
              {/* Mostrar métricas da pergunta selecionada */}
              {metrics?.funil.etapas[`quiz_pergunta_${selectedQuestion}`] && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {QUIZ_QUESTIONS.find(q => q.id === selectedQuestion)?.question}
                  </p>
                  <FunilEtapa
                    etapa={`Pergunta ${selectedQuestion}`}
                    visitantes={metrics.funil.etapas[`quiz_pergunta_${selectedQuestion}`].visitantes}
                    conversoes={metrics.funil.etapas[`quiz_pergunta_${selectedQuestion}`].conversoes}
                    taxa={metrics.funil.etapas[`quiz_pergunta_${selectedQuestion}`].taxa_conversao}
                  />
                </div>
              )}
              
              {!metrics?.funil.etapas[`quiz_pergunta_${selectedQuestion}`] && (
                <p className="text-gray-500 text-sm">Nenhum dado disponível para esta pergunta ainda.</p>
              )}
            </div>
            
            {/* Etapas finais do funil */}
            {(() => {
              const etapasFinais = [
                { key: 'vsl', nome: 'VSL' },
                { key: 'sales', nome: 'Página de Vendas' }
              ];
              
              return etapasFinais.map(({ key, nome }) => {
                const data = metrics?.funil.etapas[key] || {
                  visitantes: 0,
                  conversoes: 0,
                  taxa_conversao: 0
                };
                
                return (
                  <FunilEtapa
                    key={key}
                    etapa={nome}
                    visitantes={data.visitantes}
                    conversoes={data.conversoes}
                    taxa={data.taxa_conversao}
                  />
                );
              });
            })()}
          </div>
        </motion.div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Funil de Conversão */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <BarChart2 className="w-6 h-6 mr-2" />
              Gráfico do Funil
            </h2>
            {metrics?.funil && <FunilChart funilData={metrics.funil} />}
          </motion.div>

          {/* Distribuição de Urgência */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <PieChart className="w-6 h-6 mr-2" />
              Distribuição de Urgência
            </h2>
            <UrgenciaChart 
              critica={resumoSeguro.urgencia_critica}
              alta={resumoSeguro.urgencia_alta}
              moderada={resumoSeguro.urgencia_moderada}
            />
          </motion.div>
        </div>

        {/* Timeline e Abandono */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Linha Temporal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              Métricas Temporais
            </h2>
            {metrics?.metricas_diarias && <TimelineChart metricasDiarias={metrics.metricas_diarias} />}
          </motion.div>

          {/* Taxa de Abandono */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <TrendingDown className="w-6 h-6 mr-2" />
              Abandono do Funil
            </h2>
            {metrics?.funil && <AbandonoChart funilData={metrics.funil} />}
          </motion.div>
        </div>

        {/* Heatmap de Horários */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Clock className="w-6 h-6 mr-2" />
            Mapa de Calor - Atividade por Horário
          </h2>
          {resumoSeguro?.horarios_atividade && <HeatmapChart horariosAtividade={resumoSeguro.horarios_atividade} />}
        </motion.div>

        {/* Cards de Métricas de Urgência */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Activity className="w-6 h-6 mr-2" />
            Resumo de Urgência (Hoje)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UrgenciaCard
              tipo="Crítica"
              valor={resumoSeguro.urgencia_critica}
              cor="red"
              percentual={resumoSeguro.quiz_completados > 0 ? (resumoSeguro.urgencia_critica / resumoSeguro.quiz_completados * 100) : 0}
            />
            <UrgenciaCard
              tipo="Alta"
              valor={resumoSeguro.urgencia_alta}
              cor="yellow"
              percentual={resumoSeguro.quiz_completados > 0 ? (resumoSeguro.urgencia_alta / resumoSeguro.quiz_completados * 100) : 0}
            />
            <UrgenciaCard
              tipo="Moderada"
              valor={resumoSeguro.urgencia_moderada}
              cor="green"
              percentual={resumoSeguro.quiz_completados > 0 ? (resumoSeguro.urgencia_moderada / resumoSeguro.quiz_completados * 100) : 0}
            />
          </div>
        </motion.div>

        {/* Últimas Sessões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Clock className="w-6 h-6 mr-2" />
            Últimas Sessões
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">IP</th>
                  <th className="text-left py-2">Etapa Final</th>
                  <th className="text-left py-2">Completou</th>
                  <th className="text-left py-2">Urgência</th>
                  <th className="text-left py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.sessoes.slice(-10).reverse().map((sessao) => (
                  <tr key={sessao.id} className="border-b border-gray-100">
                    <td className="py-2">#{(sessao as any).session_id || sessao.id}</td>
                    <td className="py-2 text-xs font-mono">{(sessao as any).ip_address || 'N/A'}</td>
                    <td className="py-2">{sessao.etapa_final}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        sessao.completou ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sessao.completou ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="py-2">
                      {sessao.resultado_urgencia && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          sessao.resultado_urgencia === 'HIGH_URGENCY' ? 'bg-red-100 text-red-800' :
                          sessao.resultado_urgencia === 'MEDIUM_URGENCY' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {sessao.resultado_urgencia === 'HIGH_URGENCY' ? 'Crítica' :
                           sessao.resultado_urgencia === 'MEDIUM_URGENCY' ? 'Alta' : 'Moderada'}
                        </span>
                      )}
                    </td>
                    <td className="py-2">{sessao.data_acesso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
      {/* Modal de Exportação */}
      {showExportModal && (
        <ExportOptions
          data={metrics}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {/* Modal para remover IP */}
      {showRemoveIpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md mx-4"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Remover IP do Controle</h3>
            <p className="text-gray-600 mb-4">
              Digite o IP que deseja remover do controle de deduplicação:
            </p>
            <input
              type="text"
              value={ipToRemove}
              onChange={(e) => setIpToRemove(e.target.value)}
              placeholder="Exemplo: 179.191.223.5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-6"
              data-testid="ip-input"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRemoveIpModal(false);
                  setIpToRemove('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                data-testid="cancel-remove-ip"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveIp}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                data-testid="confirm-remove-ip"
              >
                Remover IP
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Modal de Confirmação de Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md mx-4"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirmar Reset das Métricas</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja zerar todas as métricas? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                data-testid="cancel-reset"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetMetrics}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                data-testid="confirm-reset"
              >
                Sim, Zerar Tudo
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Modal de Confirmação - Reset Horários */}
      {showResetHorariosConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md mx-4"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirmar Reset dos Horários</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja zerar apenas os dados de horários de atividade? 
              Isso vai limpar o mapa de calor mas manter todas as outras métricas.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetHorariosConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                data-testid="cancel-reset-horarios"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetHorarios}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                data-testid="confirm-reset-horarios"
              >
                Sim, Zerar Horários
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Componentes auxiliares
function MetricCard({ titulo, valor, icone, cor, ...props }: {
  titulo: string;
  valor: string | number;
  icone: React.ReactNode;
  cor: 'blue' | 'green' | 'purple' | 'orange' | 'indigo';
  [key: string]: any;
}) {
  const cores = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-r ${cores[cor]} text-white rounded-xl p-6 shadow-lg`}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">{titulo}</p>
          <p className="text-2xl font-bold mt-1">{valor}</p>
        </div>
        <div className="text-white/80">
          {icone}
        </div>
      </div>
    </motion.div>
  );
}

function FunilEtapa({ etapa, visitantes, conversoes, taxa }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{etapa}</h3>
        <p className="text-sm text-gray-600">{visitantes} visitantes</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="font-semibold text-gray-800">{conversoes}</p>
          <p className="text-sm text-gray-600">conversões</p>
        </div>
        
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(taxa, 100)}%` }}
          />
        </div>
        
        <div className="text-right min-w-[60px]">
          <p className="font-semibold text-gray-800">{taxa.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

function UrgenciaCard({ tipo, valor, cor, percentual }: {
  tipo: string;
  valor: number;
  cor: 'red' | 'yellow' | 'green';
  percentual: number;
}) {
  const cores = {
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <div className={`bg-gradient-to-r ${cores[cor]} text-white rounded-lg p-4`}>
      <h3 className="font-semibold mb-2">Urgência {tipo}</h3>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-white/80 text-sm">{percentual.toFixed(1)}% do total</p>
    </div>
  );
}