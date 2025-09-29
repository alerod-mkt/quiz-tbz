import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

interface Sale {
  id: string;
  customer_name: string;
  product_name: string;
  product_value: number | null; // Adicionado o campo product_value
  purchase_date: string;
  created_at: string;
}

interface BuyersScreenProps {
  dateFilter: 'all' | 'today' | 'yesterday' | 'custom';
  customDate: string;
}

const BackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
  </svg>
);

const BuyersScreen: React.FC<BuyersScreenProps> = ({ dateFilter, customDate }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedSales = await api.getSales(dateFilter, customDate);
      setSales(fetchedSales);
    } catch (err: any) {
      console.error('Erro ao buscar vendas:', err);
      setError(err.message || 'Não foi possível carregar as vendas.');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [dateFilter, customDate]); // Depende das props do filtro global

  const handleBack = () => {
    window.location.href = '/painel'; // Volta para o dashboard principal
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
                <h1 className="text-3xl font-bold text-gray-900">Compradores</h1>
                <p className="text-gray-600">Lista detalhada de todas as vendas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* O filtro de data foi movido para o cabeçalho do DashboardScreen */}
        {/* Tabela de Vendas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista de Compradores ({sales.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome do Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor do Produto
                  </th> {/* Nova coluna */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora da Compra
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center"> {/* Colspan ajustado para 4 */}
                      <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Carregando vendas...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-red-500"> {/* Colspan ajustado para 4 */}
                      {error}
                    </td>
                  </tr>
                ) : sales.length > 0 ? (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sale.customer_name}</div>
                        <div className="text-sm text-gray-500">{sale.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{sale.product_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(sale.product_value)}
                      </td> {/* Exibindo o valor do produto */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(sale.purchase_date)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center"> {/* Colspan ajustado para 4 */}
                      <p className="text-gray-500">Nenhuma venda encontrada para o filtro selecionado.</p>
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

export default BuyersScreen;