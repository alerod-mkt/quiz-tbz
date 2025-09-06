import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, BarChart3, Calendar } from 'lucide-react';

interface ExportData {
  funil: any;
  metricas_diarias: any;
  sessoes: any[];
  resumo_hoje: any;
}

interface ExportOptionsProps {
  data: ExportData | undefined;
  onClose: () => void;
}

export function ExportOptions({ data, onClose }: ExportOptionsProps) {
  const [formatoSelecionado, setFormatoSelecionado] = useState<'CSV' | 'JSON'>('JSON');
  const [tipoRelatorio, setTipoRelatorio] = useState<'completo' | 'funil' | 'diario'>('completo');

  const gerarRelatorioCompleto = () => {
    if (!data) return;

    const relatorio = {
      timestamp: new Date().toISOString(),
      resumo_executivo: {
        total_visitantes: data.resumo_hoje?.visitantes_unicos || 0,
        quiz_completados: data.resumo_hoje?.quiz_completados || 0,
        taxa_conversao: data.resumo_hoje?.taxa_conversao_geral || 0,
        urgencia_critica: data.resumo_hoje?.urgencia_critica || 0,
        urgencia_alta: data.resumo_hoje?.urgencia_alta || 0,
        urgencia_moderada: data.resumo_hoje?.urgencia_moderada || 0
      },
      funil_conversao: data.funil,
      sessoes_anonimas: data.sessoes.length,
      metricas_por_data: Object.keys(data.metricas_diarias).length
    };

    return relatorio;
  };

  const gerarRelatorioFunil = () => {
    if (!data?.funil?.etapas) return;

    const funilData = Object.entries(data.funil.etapas).map(([etapa, dados]: [string, any]) => ({
      etapa: dados.nome || etapa,
      visitantes: dados.visitantes,
      conversoes: dados.conversoes,
      taxa_conversao: dados.taxa_conversao
    }));

    return {
      timestamp: new Date().toISOString(),
      tipo: 'Relatório de Funil de Conversão',
      etapas: funilData,
      resumo: {
        total_etapas: funilData.length,
        melhor_conversao: funilData.reduce((max, etapa) => 
          etapa.taxa_conversao > max.taxa_conversao ? etapa : max, 
          { taxa_conversao: 0 }
        ),
        pior_conversao: funilData.reduce((min, etapa) => 
          etapa.taxa_conversao < min.taxa_conversao ? etapa : min, 
          { taxa_conversao: 100 }
        )
      }
    };
  };

  const gerarRelatorioDiario = () => {
    if (!data?.metricas_diarias) return;

    const metricas = Object.entries(data.metricas_diarias).map(([data_str, metricas]: [string, any]) => ({
      data: data_str,
      visitantes: metricas.visitantes_unicos,
      quiz_iniciados: metricas.quiz_iniciados,
      quiz_completados: metricas.quiz_completados,
      taxa_conversao: metricas.taxa_conversao_geral,
      urgencia_critica: metricas.urgencia_critica,
      urgencia_alta: metricas.urgencia_alta,
      urgencia_moderada: metricas.urgencia_moderada
    })).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    return {
      timestamp: new Date().toISOString(),
      tipo: 'Relatório de Métricas Diárias',
      periodo: `${metricas[0]?.data} até ${metricas[metricas.length - 1]?.data}`,
      metricas_diarias: metricas,
      resumo: {
        total_dias: metricas.length,
        media_visitantes: metricas.reduce((sum, m) => sum + m.visitantes, 0) / metricas.length,
        media_conversao: metricas.reduce((sum, m) => sum + m.taxa_conversao, 0) / metricas.length
      }
    };
  };

  const exportarDados = () => {
    let dadosExport;
    let nomeArquivo;

    switch (tipoRelatorio) {
      case 'funil':
        dadosExport = gerarRelatorioFunil();
        nomeArquivo = `quiz-funil-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'diario':
        dadosExport = gerarRelatorioDiario();
        nomeArquivo = `quiz-metricas-diarias-${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        dadosExport = gerarRelatorioCompleto();
        nomeArquivo = `quiz-relatorio-completo-${new Date().toISOString().split('T')[0]}`;
    }

    if (!dadosExport) {
      alert('Nenhum dado disponível para exportação');
      return;
    }

    if (formatoSelecionado === 'JSON') {
      const blob = new Blob([JSON.stringify(dadosExport, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nomeArquivo}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Converter para CSV baseado no tipo de relatório
      let csvContent = '';
      
      if (tipoRelatorio === 'funil' && dadosExport.etapas) {
        csvContent = 'Etapa,Visitantes,Conversões,Taxa de Conversão\\n';
        csvContent += dadosExport.etapas
          .map((etapa: any) => `${etapa.etapa},${etapa.visitantes},${etapa.conversoes},${etapa.taxa_conversao.toFixed(2)}%`)
          .join('\\n');
      } else if (tipoRelatorio === 'diario' && dadosExport.metricas_diarias) {
        csvContent = 'Data,Visitantes,Quiz Iniciados,Quiz Completados,Taxa Conversão,Urgência Crítica,Urgência Alta,Urgência Moderada\\n';
        csvContent += dadosExport.metricas_diarias
          .map((m: any) => `${m.data},${m.visitantes},${m.quiz_iniciados},${m.quiz_completados},${m.taxa_conversao.toFixed(2)}%,${m.urgencia_critica},${m.urgencia_alta},${m.urgencia_moderada}`)
          .join('\\n');
      } else {
        // Relatório completo em CSV
        csvContent = 'Métrica,Valor\\n';
        csvContent += `Visitantes Únicos,${dadosExport.resumo_executivo?.total_visitantes || 0}\\n`;
        csvContent += `Quiz Completados,${dadosExport.resumo_executivo?.quiz_completados || 0}\\n`;
        csvContent += `Taxa de Conversão,${(dadosExport.resumo_executivo?.taxa_conversao || 0).toFixed(2)}%\\n`;
        csvContent += `Urgência Crítica,${dadosExport.resumo_executivo?.urgencia_critica || 0}\\n`;
        csvContent += `Urgência Alta,${dadosExport.resumo_executivo?.urgencia_alta || 0}\\n`;
        csvContent += `Urgência Moderada,${dadosExport.resumo_executivo?.urgencia_moderada || 0}\\n`;
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nomeArquivo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Download className="w-6 h-6 mr-2" />
          Exportar Relatório
        </h2>

        <div className="space-y-6">
          {/* Tipo de Relatório */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tipo de Relatório
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="completo"
                  checked={tipoRelatorio === 'completo'}
                  onChange={(e) => setTipoRelatorio(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span>Relatório Completo</span>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  value="funil"
                  checked={tipoRelatorio === 'funil'}
                  onChange={(e) => setTipoRelatorio(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>Funil de Conversão</span>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  value="diario"
                  checked={tipoRelatorio === 'diario'}
                  onChange={(e) => setTipoRelatorio(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Métricas Diárias</span>
                </div>
              </label>
            </div>
          </div>

          {/* Formato */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Formato de Exportação
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormatoSelecionado('JSON')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formatoSelecionado === 'JSON'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">JSON</div>
                  <div className="text-xs text-gray-500">Dados estruturados</div>
                </div>
              </button>
              
              <button
                onClick={() => setFormatoSelecionado('CSV')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formatoSelecionado === 'CSV'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">CSV</div>
                  <div className="text-xs text-gray-500">Planilha</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex space-x-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={exportarDados}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}