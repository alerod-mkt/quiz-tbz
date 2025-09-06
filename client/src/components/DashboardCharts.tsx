import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
);

interface FunilData {
  etapas: { [key: string]: {
    nome: string;
    visitantes: number;
    conversoes: number;
    taxa_conversao: number;
  }};
}

interface MetricasDiarias {
  [date: string]: {
    visitantes_unicos: number;
    quiz_completados: number;
    taxa_conversao_geral: number;
    urgencia_critica: number;
    urgencia_alta: number;
    urgencia_moderada: number;
    horarios_atividade: { [hora: string]: number };
  };
}

// Gráfico de Funil de Conversão
export function FunilChart({ funilData }: { funilData: FunilData }) {
  const etapasOrdenadas = [
    'landing', 'quiz_inicio', 'vsl', 'sales'
  ];

  const dados = etapasOrdenadas
    .filter(etapa => funilData.etapas[etapa])
    .map(etapa => {
      let nomeEtapa = funilData.etapas[etapa].nome || etapa;
      if (etapa === 'quiz_inicio') {
        nomeEtapa = 'Iniciou o Quiz';
      } else if (etapa === 'landing') {
        nomeEtapa = 'Página Inicial';
      } else if (etapa === 'vsl') {
        nomeEtapa = 'VSL';
      } else if (etapa === 'sales') {
        nomeEtapa = 'Página de Vendas';
      }
      
      return {
        etapa: nomeEtapa,
        visitantes: funilData.etapas[etapa].visitantes,
        conversoes: funilData.etapas[etapa].conversoes
      };
    });

  const chartData = {
    labels: dados.map(d => d.etapa),
    datasets: [
      {
        label: 'Visitantes',
        data: dados.map(d => d.visitantes),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Conversões',
        data: dados.map(d => d.conversoes),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      }
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Funil de Conversão',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

// Gráfico de Pizza para Distribuição de Urgência
export function UrgenciaChart({ 
  critica, 
  alta, 
  moderada 
}: { 
  critica: number; 
  alta: number; 
  moderada: number; 
}) {
  const total = critica + alta + moderada;
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Nenhum dados de urgência disponível
      </div>
    );
  }

  const chartData = {
    labels: ['Urgência Crítica', 'Urgência Alta', 'Urgência Moderada'],
    datasets: [
      {
        data: [critica, alta, moderada],
        backgroundColor: [
          '#ef4444', // red-500
          '#f59e0b', // amber-500  
          '#22c55e', // green-500
        ],
        borderColor: [
          '#dc2626', // red-600
          '#d97706', // amber-600
          '#16a34a', // green-600
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Distribuição de Urgência',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return <Doughnut data={chartData} options={options} />;
}

// Gráfico de Linha Temporal para Métricas por Dia
export function TimelineChart({ metricasDiarias }: { metricasDiarias: MetricasDiarias }) {
  // Gerar últimos 7 dias (incluindo hoje) mesmo se não há dados para todos
  const hoje = new Date();
  const ultimosDias = [];
  for (let i = 6; i >= 0; i--) {
    const data = new Date(hoje.getTime() - (i * 24 * 60 * 60 * 1000));
    ultimosDias.push(data.toISOString().split('T')[0]);
  }

  const totalDados = ultimosDias.reduce((sum, data) => 
    sum + (metricasDiarias[data]?.visitantes_unicos || 0) + (metricasDiarias[data]?.quiz_completados || 0), 0
  );

  if (totalDados === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Nenhum dado histórico disponível para os últimos 7 dias
      </div>
    );
  }

  const chartData = {
    labels: ultimosDias.map(data => {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Visitantes',
        data: ultimosDias.map(data => metricasDiarias[data]?.visitantes_unicos || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Quiz Completados',
        data: ultimosDias.map(data => metricasDiarias[data]?.quiz_completados || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Métricas dos Últimos 7 Dias',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

// Heatmap de Horários de Atividade
export function HeatmapChart({ horariosAtividade }: { horariosAtividade: { [hora: string]: number } }) {
  const horas = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const maxActividade = Math.max(...Object.values(horariosAtividade));

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Atividade por Horário (Hoje)</h3>
      <div className="grid grid-cols-12 gap-1">
        {horas.map(hora => {
          const atividade = horariosAtividade[hora] || 0;
          const intensity = maxActividade > 0 ? atividade / maxActividade : 0;
          
          return (
            <div
              key={hora}
              className="relative group"
              title={`${hora}h: ${atividade} visitantes`}
            >
              <div
                className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-xs font-medium transition-all hover:scale-110"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                  color: intensity > 0.5 ? 'white' : '#374151'
                }}
              >
                {hora}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {hora}h: {atividade} visitantes
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legenda */}
      <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
        <span>Menos atividade</span>
        <div className="flex space-x-1">
          {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
            <div
              key={intensity}
              className="w-3 h-3 rounded border border-gray-200"
              style={{ backgroundColor: `rgba(59, 130, 246, ${intensity})` }}
            />
          ))}
        </div>
        <span>Mais atividade</span>
      </div>
    </div>
  );
}

// Gráfico de Barras para Taxa de Abandono do Funil Completo
export function AbandonoChart({ funilData }: { funilData: FunilData }) {
  // Definir ordem correta do funil completo
  const ordemFunil = [
    'landing',
    'quiz_inicio',
    'quiz_pergunta_2',
    'quiz_pergunta_3',
    'quiz_pergunta_4',
    'quiz_pergunta_5',
    'quiz_pergunta_6',
    'quiz_pergunta_7',
    'quiz_pergunta_8',
    'quiz_pergunta_9',
    'quiz_pergunta_10',
    'quiz_pergunta_11',
    'quiz_pergunta_12',
    'quiz_pergunta_13',
    'quiz_pergunta_14',
    'quiz_pergunta_15',
    'vsl',
    'sales'
  ];

  // Mapear nomes amigáveis
  const nomesFriendly: { [key: string]: string } = {
    'landing': 'Página Inicial',
    'quiz_inicio': 'Iniciou Quiz',
    'quiz_pergunta_2': 'P2',
    'quiz_pergunta_3': 'P3',
    'quiz_pergunta_4': 'P4',
    'quiz_pergunta_5': 'P5',
    'quiz_pergunta_6': 'P6',
    'quiz_pergunta_7': 'P7',
    'quiz_pergunta_8': 'P8',
    'quiz_pergunta_9': 'P9',
    'quiz_pergunta_10': 'P10',
    'quiz_pergunta_11': 'P11',
    'quiz_pergunta_12': 'P12',
    'quiz_pergunta_13': 'P13',
    'quiz_pergunta_14': 'P14',
    'quiz_pergunta_15': 'P15',
    'vsl': 'VSL',
    'sales': 'Página de Vendas'
  };

  // Calcular abandono para cada etapa do funil
  const dadosAbandono = ordemFunil.map(etapa => {
    const dados = funilData.etapas?.[etapa];
    const taxaAbandono = dados?.visitantes > 0 
      ? ((dados.visitantes - dados.conversoes) / dados.visitantes) * 100 
      : 0;
    
    return {
      etapa: nomesFriendly[etapa] || etapa,
      taxa: taxaAbandono,
      visitantes: dados?.visitantes || 0,
      conversoes: dados?.conversoes || 0
    };
  }).filter(item => item.visitantes > 0); // Mostrar apenas etapas com dados

  const chartData = {
    labels: dadosAbandono.map(d => d.etapa),
    datasets: [
      {
        label: 'Taxa de Abandono (%)',
        data: dadosAbandono.map(d => d.taxa),
        backgroundColor: dadosAbandono.map(d => 
          d.taxa > 50 ? 'rgba(239, 68, 68, 0.8)' : 
          d.taxa > 25 ? 'rgba(245, 158, 11, 0.8)' : 
          'rgba(34, 197, 94, 0.8)'
        ),
        borderColor: dadosAbandono.map(d => 
          d.taxa > 50 ? 'rgba(239, 68, 68, 1)' : 
          d.taxa > 25 ? 'rgba(245, 158, 11, 1)' : 
          'rgba(34, 197, 94, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Abandono do Funil',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const dados = dadosAbandono[index];
            return [
              `Taxa de Abandono: ${context.parsed.y.toFixed(1)}%`,
              `Visitantes: ${dados.visitantes}`,
              `Conversões: ${dados.conversoes}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
  };

  return <Bar data={chartData} options={options} />;
}