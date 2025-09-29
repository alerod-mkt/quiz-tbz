import React, { useState, useEffect } from 'react';
import * as api from '../api';

interface Visit {
  id: string;
  ip_address: string;
  country_code: string;
  city: string;
  country_name: string;
  user_agent: string;
  created_at: string;
}

interface VisitsScreenProps {
  dateFilter: 'all' | 'today' | 'yesterday' | 'custom';
  customDate: string;
}

const BackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
  </svg>
);

const VisitsScreen: React.FC<VisitsScreenProps> = ({ dateFilter, customDate }) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedVisits = await api.getVisits(dateFilter, customDate);
      setVisits(fetchedVisits);
    } catch (err: any) {
      console.error('Erro ao buscar visitas:', err);
      setError(err.message || 'Não foi possível carregar as visitas.');
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [dateFilter, customDate]); // Depende das props do filtro global

  const handleBack = () => {
    window.location.href = '/painel';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'BR': '🇧🇷',
      'US': '🇺🇸',
      'AR': '🇦🇷',
      'CL': '🇨🇱',
      'CO': '🇨🇴',
      'MX': '🇲🇽',
      'PE': '🇵🇪',
      'UY': '🇺🇾',
      'PY': '🇵🇾',
      'BO': '🇧🇴',
      'EC': '🇪🇨',
      'VE': '🇻🇪'
    };
    return flags[countryCode] || '🌍';
  };

  const getCountryName = (countryCode: string) => {
    const countries: { [key: string]: string } = {
      'BR': 'Brasil',
      'US': 'Estados Unidos',
      'AR': 'Argentina',
      'CL': 'Chile',
      'CO': 'Colômbia',
      'MX': 'México',
      'PE': 'Peru',
      'UY': 'Uruguai',
      'PY': 'Paraguai',
      'BO': 'Bolívia',
      'EC': 'Equador',
      'VE': 'Venezuela'
    };
    return countries[countryCode] || countryCode;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleBack} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <BackIcon className="w-8 h-8"/>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Visitas Detalhadas</h1>
                <p className="text-gray-600">Acompanhe todas as visitas ao seu quiz</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* O filtro de data foi movido para o cabeçalho do DashboardScreen */}
        {/* Tabela de Visitas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista de Visitas ({visits.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Carregando visitas...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : visits.length > 0 ? (
                  visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">{visit.ip_address}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getCountryFlag(visit.country_code)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getCountryName(visit.country_code)}
                            </div>
                            {visit.city && (
                              <div className="text-sm text-gray-500">{visit.city}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={visit.user_agent}>
                          {visit.user_agent || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(visit.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <p className="text-gray-500">Nenhuma visita encontrada para o filtro selecionado.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitsScreen;