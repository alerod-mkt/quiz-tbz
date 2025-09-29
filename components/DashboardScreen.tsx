import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../src/integrations/supabase/client';
import * as api from '../api';
import Reino360Logo from '../src/assets/images/reino-360-logo.png'; // Importando o logo
import BuyersScreen from './BuyersScreen'; // Importando o novo componente BuyersScreen
import VisitsScreen from './VisitsScreen'; // Importando o componente VisitsScreen

interface DashboardScreenProps {
  totalQuestions: number;
}

// Ícones SVG
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
  </svg>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
    </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowRightCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DollarSignIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V3m0 9v3m0 3.545c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


const MetricCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const FunnelChart: React.FC<{ data: Array<{ step: string; count: number; percentage: number }> }> = ({ data }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{item.step}</span>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">{item.count}</span>
              <span className="text-sm text-gray-500">({item.percentage}%)</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'][index % 5]
              }`}
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AbandonmentChart: React.FC<{ data: any; totalVisits: number }> = ({ data, totalVisits }) => {
  const translateStepName = (step: string) => {
    if (step.startsWith('pergunta_')) {
      return `Pergunta ${step.split('_')[1]}`;
    }
    const translations: { [key: string]: string } = {
      'pagina_inicial': 'Página Inicial',
      'quiz_start': 'Início do Quiz',
      'cadastro_lead': 'Cadastro de Lead',
    };
    return translations[step] || step;
  };

  const chartData = Object.entries(data)
    .map(([step, stats]: [string, any]) => {
      const abandonmentCount = stats.abandoned_count;
      const abandonmentPercentage = totalVisits > 0 ? Math.round((abandonmentCount / totalVisits) * 100) : 0;
      
      return {
        step: translateStepName(step),
        count: abandonmentCount,
        percentage: abandonmentPercentage,
      };
    })
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) {
    return <p className="text-center text-gray-500 py-8">Nenhum dado de abandono para o período selecionado.</p>;
  }

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 px-4 py-3 bg-gray-100 rounded-t-lg font-semibold text-gray-600 text-sm">
        <span>Etapa</span>
        <span className="text-center">Abandonos</span>
        <span className="text-center">% do Total</span>
        <span className="text-center">Visualização</span>
      </div>
      {chartData.map(({ step, count, percentage }) => (
        <div key={step} className="grid grid-cols-4 items-center bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
          <h4 className="font-medium text-gray-800 text-sm">{step}</h4>
          <span className="text-center text-lg font-bold text-red-600">{count}</span>
          <span className="text-center text-sm font-semibold text-red-500">{percentage}%</span>
          <div className="flex justify-center">
            <div className="w-20 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(count / maxCount) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardScreen: React.FC<DashboardScreenProps> = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'abandonment' | 'visits' | 'buyers'>('overview');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMetrics = await api.getMetrics(dateFilter, customDate);
      setMetrics(fetchedMetrics);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message || 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customDate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_events' }, () => {
        console.log('Novo evento detectado (quiz_events), atualizando...');
        fetchInitialData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_visits' }, () => {
        console.log('Nova visita detectada (quiz_visits), atualizando...');
        fetchInitialData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_abandonments' }, () => {
        console.log('Novo abandono detectado (quiz_abandonments), atualizando...');
        fetchInitialData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, () => { // NOVO: Escuta por novas vendas
        console.log('Nova venda detectada (sales), atualizando...');
        fetchInitialData();
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log('✅ Realtime Dashboard Conectado!');
        if (status === 'CHANNEL_ERROR') console.error('❌ Erro no Realtime Dashboard:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitialData]);

  const handleClearMetrics = async () => {
    if (window.confirm('Você tem certeza que deseja apagar TODOS os dados de métricas? Esta ação é irreversível.')) {
      try {
        await api.clearAllMetrics();
        alert('Métricas limpas com sucesso!');
        fetchInitialData();
      } catch (err: any) {
        alert(`Erro ao limpar métricas: ${err.message}`);
      }
    }
  };
  
  const handleRemoveIpCooldown = async () => {
    const ipAddress = prompt("Digite o IP para remover o cooldown de 24h (permitir nova visita):");
    if (ipAddress) {
      try {
        const result = await api.removeIpData(ipAddress);
        alert(result.message || "Cooldown removido! O IP pode visitar novamente.");
        sessionStorage.removeItem('visit_tracked');
        sessionStorage.removeItem('quiz_session_id');
        sessionStorage.removeItem('quiz_session_timestamp');
      } catch (err: any) {
        alert(`Erro ao remover cooldown: ${err.message}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    window.location.reload();
  };

  const { 
    total_visits, 
    total_quiz_starts, 
    total_leads, 
    total_quiz_complete, 
    total_checkout_starts,
    total_abandonments,
    total_sales, 
    total_sales_value, // NOVO: Valor total de vendas
    conversion_rates, 
    funnel_data,
    abandonment_by_step
  } = metrics || {};

  // Cálculos dos novos percentuais
  const quizStartConversionRate = conversion_rates?.visit_to_quiz_start || 0;
  const leadConversionFromVisits = conversion_rates?.quiz_start_to_lead || 0; 
  const checkoutConversionFromQuizComplete = conversion_rates?.quiz_complete_to_checkout || 0;
  const abandonmentRateFromVisits = total_visits > 0 ? Math.round((total_abandonments / total_visits) * 100) : 0;
  const salesConversionFromLeads = conversion_rates?.sales_conversion_from_leads || 0; 

  // Função para formatar o valor como moeda
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Substituindo o h1 pelo logo */}
              <img src={Reino360Logo} alt="Reino 360 Logo" className="h-10 w-auto" />
            </div>
            <div className="flex items-center space-x-2">
              {/* Filtro de data global */}
              <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <FilterIcon className="w-5 h-5 text-gray-400" />
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="bg-white focus:outline-none">
                    <option value="all">Todo o Período</option>
                    <option value="today">Hoje</option>
                    <option value="yesterday">Ontem</option>
                    <option value="custom">Personalizada</option>
                  </select>
                  {dateFilter === 'custom' && (
                    <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="bg-white border-l border-gray-300 ml-2 pl-2 focus:outline-none"/>
                  )}
              </div>
              <button onClick={handleClearMetrics} className="text-sm bg-red-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-red-700 transition-colors">Limpar Métricas</button>
              <button onClick={handleLogout} className="text-sm bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors">Sair</button>
            </div>
          </div>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['overview', 'funnel', 'abandonment', 'visits', 'buyers'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                { {overview: 'Visão Geral', funnel: 'Funil', abandonment: 'Abandono', visits: 'Visitas', buyers: 'Compradores'}[tab] }
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* O filtro de data foi movido para o cabeçalho, então não precisamos mais dele aqui */}
        {loading && activeTab !== 'buyers' && activeTab !== 'visits' ? ( // Loading apenas para as abas que dependem de metrics
          <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Carregando dados...</p></div>
        ) : error && activeTab !== 'buyers' && activeTab !== 'visits' ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Primeira linha de 5 cards */}
                  <MetricCard title="Visitas" value={total_visits || 0} icon={<UsersIcon className="w-6 h-6 text-white" />} color="bg-blue-500" />
                  <MetricCard title="Quiz Iniciados" value={total_quiz_starts || 0} icon={<PlayIcon className="w-6 h-6 text-white" />} color="bg-green-500" />
                  <MetricCard 
                    title="Conversão Quiz Iniciado" 
                    value={`${quizStartConversionRate}%`} 
                    icon={<ArrowRightCircleIcon className="w-6 h-6 text-white" />} 
                    color="bg-green-600" 
                  />
                  <MetricCard title="Leads" value={total_leads || 0} icon={<UserCheckIcon className="w-6 h-6 text-white" />} color="bg-yellow-500" />
                  <MetricCard 
                    title="Conversão Leads" 
                    value={`${leadConversionFromVisits}%`} 
                    icon={<ArrowRightCircleIcon className="w-6 h-6 text-white" />} 
                    color="bg-yellow-600" 
                  />
                  
                  {/* Segunda linha de 5 cards */}
                  <MetricCard title="Total Abandonos" value={total_abandonments || 0} icon={<XCircleIcon className="w-6 h-6 text-white" />} color="bg-red-500" />
                  <MetricCard 
                    title="Percentual de Abandono" 
                    value={`${abandonmentRateFromVisits}%`} 
                    icon={<XCircleIcon className="w-6 h-6 text-white" />} 
                    color="bg-red-600" 
                  />
                  <MetricCard title="Quiz Completos" value={total_quiz_complete || 0} icon={<CheckCircleIcon className="w-6 h-6 text-white" />} color="bg-purple-500" />
                  <MetricCard title="Checkouts" value={total_checkout_starts || 0} icon={<ShoppingCartIcon className="w-6 h-6 text-white" />} color="bg-pink-500" />
                  <MetricCard 
                    title="Conversão Checkout" 
                    value={`${checkoutConversionFromQuizComplete}%`} 
                    icon={<ArrowRightCircleIcon className="w-6 h-6 text-white" />} 
                    color="bg-pink-600" 
                  />
                </div>
                {/* NOVA LINHA para os cards de Vendas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"> {/* Alterado para lg:grid-cols-3 */}
                  <div> {/* Removido lg:col-span-X, mx-auto, w-full */}
                    <MetricCard 
                      title="Vendas Totais" 
                      value={total_sales || 0} 
                      icon={<DollarSignIcon className="w-6 h-6 text-white" />} 
                      color="bg-indigo-500" 
                    />
                  </div>
                  <div> {/* Removido lg:col-span-X, mx-auto, w-full */}
                    <MetricCard 
                      title="Valor Total de Vendas" 
                      value={formatCurrency(total_sales_value)} 
                      icon={<DollarSignIcon className="w-6 h-6 text-white" />} 
                      color="bg-indigo-700" 
                    />
                  </div>
                  <div> {/* Removido lg:col-span-X, mx-auto, w-full */}
                    <MetricCard 
                      title="Conversão Vendas (de Leads)" 
                      value={`${salesConversionFromLeads}%`} 
                      icon={<ArrowRightCircleIcon className="w-6 h-6 text-white" />} 
                      color="bg-indigo-600" 
                    />
                  </div>
                </div>
              </>
            )}
            {activeTab === 'funnel' && (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"><h2 className="text-2xl font-bold text-gray-900 mb-6">Funil de Conversão</h2><FunnelChart data={funnel_data || []} /></div>
            )}
            {activeTab === 'abandonment' && (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Análise de Abandono por Etapa</h2>
                <p className="text-gray-600 mb-6">Percentuais calculados em relação ao total de visitas ({total_visits || 0})</p>
                <AbandonmentChart data={abandonment_by_step || {}} totalVisits={total_visits || 0} />
              </div>
            )}
            {activeTab === 'visits' && (
              <VisitsScreen dateFilter={dateFilter} customDate={customDate} />
            )}
            {activeTab === 'buyers' && (
              <BuyersScreen dateFilter={dateFilter} customDate={customDate} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;