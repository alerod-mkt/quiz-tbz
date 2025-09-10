import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CheckoutPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutPopup({ isOpen, onClose }: CheckoutPopupProps) {
  const [formData, setFormData] = useState({
    email: '',
    nomeCompleto: '',
    celular: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simular um pequeno delay para melhor UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extrair código de área e número do celular
      // Formato esperado: (11) 99999-9999 ou 11999999999
      const celularLimpo = formData.celular.replace(/[^0-9]/g, '');
      const phoneac = celularLimpo.substring(0, 2); // Primeiros 2 dígitos (código de área)
      const phonenumber = celularLimpo.substring(2); // Restante do número
      
      // Construir URL da Hotmart com parâmetros pré-preenchidos
      const baseUrl = 'https://pay.hotmart.com/S101001652G?off=mesaihyj&checkoutMode=10';
      const params = new URLSearchParams({
        name: formData.nomeCompleto,
        email: formData.email,
        phoneac: phoneac,
        phonenumber: phonenumber
      });
      
      const finalUrl = `${baseUrl}&${params.toString()}`;
      console.log('🚀 Redirecionando para checkout com dados pré-preenchidos:', finalUrl);
      
      // Redirecionar para o Hotmart com dados pré-preenchidos
      window.location.href = finalUrl;
    } catch (error) {
      console.error('Erro no checkout:', error);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl"
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          data-testid="close-popup"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Quase lá! 🎉
          </h2>
          <p className="text-gray-600">
            Preencha seus dados para continuar com sua compra segura
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Seu email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Digite seu email para receber a compra"
              required
              className="mt-1"
              data-testid="input-email"
            />
          </div>

          <div>
            <Label htmlFor="nomeCompleto" className="text-sm font-medium text-gray-700">
              Nome completo
            </Label>
            <Input
              id="nomeCompleto"
              type="text"
              value={formData.nomeCompleto}
              onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
              placeholder="Digite seu nome completo"
              required
              className="mt-1"
              data-testid="input-nome"
            />
          </div>

          <div>
            <Label htmlFor="celular" className="text-sm font-medium text-gray-700">
              Celular
            </Label>
            <div className="flex gap-2 mt-1">
              <div className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 flex items-center min-w-[80px]">
                +55
              </div>
              <Input
                id="celular"
                type="tel"
                value={formData.celular}
                onChange={(e) => handleInputChange('celular', e.target.value)}
                placeholder="(11) 96123-4567"
                required
                className="flex-1"
                data-testid="input-whatsapp"
              />
            </div>
          </div>

          {/* Garantia */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm text-green-700 font-medium">
              ✅ 7 Dias de Garantia Total
            </p>
            <p className="text-xs text-green-600">
              Se não funcionar, devolvemos cada centavo
            </p>
          </div>

          {/* Botão de Envio */}
          <Button
            type="submit"
            id="chk_29"
            disabled={isSubmitting || !formData.email || !formData.nomeCompleto || !formData.celular}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            data-testid="submit-checkout"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processando...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span className="text-white">⭕</span>
                Continuar com a Compra
              </div>
            )}
          </Button>

          {/* Segurança */}
          <div className="text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Pagamento 100% seguro e protegido
            </p>
          </div>
        </form>

        {/* Link oculto para conformidade */}
        <a 
          href="https://pay.hotmart.com/S101001652G?off=mesaihyj&checkoutMode=10"
          style={{ display: 'none' }}
          id="checkout-hidden-link"
          aria-hidden="true"
        >
          Checkout Oculto
        </a>
      </motion.div>
    </div>
  );
}