import { motion } from "framer-motion";
import { Clock, Check, Shield, Infinity, Lock, AlertTriangle, Target, Star, Award, Zap, Heart, Users, TrendingUp, Eye } from "lucide-react";
import { useState } from 'react';
import CheckoutPopup from '@/components/CheckoutPopup';

import { QuizAnswers } from "@/types/quiz";
import { useTrackVisitor, trackAddToCart } from '@/hooks/use-metrics';

interface SalesPageProps {
  quizAnswers?: QuizAnswers;
}

export default function SalesPage({ quizAnswers }: SalesPageProps) {
  // Rastrear visitante na página de vendas
  useTrackVisitor('sales');
  
  // Estado para controlar o popup de checkout
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  // Função para abrir popup e rastrear ADD TO CART
  const handleOpenCheckout = async () => {
    try {
      console.log('🛒 Abrindo checkout popup e rastreando ADD TO CART');
      
      // 1. Rastrear ADD TO CART
      await trackAddToCart();
      console.log('✅ ADD TO CART registrado');
      
      // 2. Abrir popup
      setIsPopupOpen(true);
      
    } catch (error) {
      console.error('Erro ao rastrear ADD TO CART:', error);
      // Mesmo com erro, abre o popup
      setIsPopupOpen(true);
    }
  };
  
  

  // Calcula resultado do diagnóstico
  const calculateDiagnostic = (answers: QuizAnswers): string => {
    if (!answers || Object.keys(answers).length === 0) return 'URGÊNCIA CRÍTICA';
    
    const totalAnswers = Object.keys(answers).length;
    const aAnswers = Object.values(answers).filter(answer => answer === 'A').length;
    const percentageA = aAnswers / totalAnswers;
    
    if (percentageA >= 0.7) return 'URGÊNCIA CRÍTICA';
    if (percentageA >= 0.4) return 'URGÊNCIA ALTA';
    return 'URGÊNCIA MODERADA';
  };

  const diagnosticResult = calculateDiagnostic(quizAnswers || {});
  
  const getDiagnosticMessage = (result: string): string => {
    switch (result) {
      case 'URGÊNCIA CRÍTICA':
        return 'SEU DIAGNÓSTICO: Seus filhos estão em RISCO EXTREMO. As brigas já estão causando danos permanentes. AÇÃO IMEDIATA necessária.';
      case 'URGÊNCIA ALTA':
        return 'SEU DIAGNÓSTICO: Situação de ALTO RISCO. Seus filhos estão sendo afetados profundamente. Intervenção urgente recomendada.';
      default:
        return 'SEU DIAGNÓSTICO: Situação de RISCO MODERADO. Ainda há tempo para evitar danos maiores aos seus filhos.';
    }
  };
  const revelacoes = [
    {
      icon: Target,
      titulo: "GATILHOS EMOCIONAIS DESCONTROLADOS",
      descricao: "Suas brigas não acontecem por acaso. Elas seguem um padrão previsível: acúmulo de frustrações → explosão → culpa → distanciamento → nova frustração. É um ciclo vicioso que se repete automaticamente."
    },
    {
      icon: AlertTriangle,
      titulo: "COMUNICAÇÃO TÓXICA INSTALADA", 
      descricao: "Vocês dois perderam a capacidade de dialogar sem atacar. Cada conversa vira campo de batalha porque não sabem mais como expressar necessidades sem soar como crítica ou cobrança."
    },
    {
      icon: Heart,
      titulo: "DANOS COLATERAIS NOS FILHOS",
      descricao: "Suas brigas estão programando seus filhos para relacionamentos disfuncionais. Eles estão aprendendo que \"amor = dor\" e que casamento é sinônimo de guerra. Isso vai afetar todos os relacionamentos futuros deles."
    }
  ];

  const fases = [
    {
      fase: "FASE 1",
      titulo: "QUEBRAR O CICLO",
      prazo: "Dias 1-2",
      descricao: "Você precisa identificar e neutralizar os gatilhos que transformam conversas normais em brigas. Existe uma técnica específica para \"desarmar\" discussões antes que explodam."
    },
    {
      fase: "FASE 2", 
      titulo: "REPROGRAMAR A COMUNICAÇÃO",
      prazo: "Dias 3-5",
      descricao: "Substituir padrões de ataque-defesa por comunicação construtiva. Isso inclui frases específicas que fazem ele te ouvir sem se sentir atacado."
    },
    {
      fase: "FASE 3",
      titulo: "CRIAR NOVA ROTINA DE PAZ", 
      prazo: "Dias 6-7",
      descricao: "Estabelecer rituais diários que mantêm a harmonia e evitam que as brigas voltem. Pequenas ações que criam grande impacto."
    }
  ];

  const bonuses = [
    {
      icon: "📱",
      titulo: "BÔNUS #1: WhatsApp da Reconquista",
      descricao: "50 mensagens prontas que fazem ele sorrir e se aproximar de você novamente"
    },
    {
      icon: "🔄", 
      titulo: "BÔNUS #2: Protocolo Pós-Briga",
      descricao: "Como reconquistar a conexão depois de uma discussão (funciona mesmo quando ele está \"emburrado\")"
    },
    {
      icon: "💫",
      titulo: "BÔNUS #3: Manual da Esposa Irresistível", 
      descricao: "15 atitudes simples que fazem qualquer marido se apaixonar novamente pela esposa"
    },
    {
      icon: "🎯",
      titulo: "BÔNUS #4: Código da Admiração",
      descricao: "A forma correta de falar dos defeitos dele sem parecer crítica ou cobrança"
    },
    {
      icon: "✉️",
      titulo: "BÔNUS #5: Suporte por Email Exclusivo", 
      descricao: "Tire suas dúvidas diretamente comigo durante todo o processo"
    },
    {
      icon: "♾️",
      titulo: "BÔNUS #6: Acesso VITALÍCIO",
      descricao: "Para sempre, sem mensalidades, sem renovação"
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 fade-in"
        >
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
            SEU DIAGNÓSTICO<br />
            <span className="text-yellow-400">ESTÁ PRONTO</span>
          </h1>
        </motion.div>

        {/* Resultado do Diagnóstico */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl p-6 md:p-8 shadow-2xl mb-8 fade-in border border-red-500"
          data-testid="diagnostic-result"
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 mr-3" />
              <h3 className="text-2xl md:text-3xl font-black">
                📊 RESULTADO: Padrão de Conflito Crítico Identificado
              </h3>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-4 mb-4 border border-white/20">
              <p className="text-xl font-bold text-yellow-300">{diagnosticResult}</p>
            </div>
            <p className="text-lg leading-relaxed mb-4">
              Baseado nas suas respostas, identifiquei que você está presa no que chamamos de <strong>"Ciclo da Briga Automática"</strong> - um padrão destrutivo onde pequenos desentendimentos se transformam em explosões emocionais que deixam cicatrizes profundas na família.
            </p>
          </div>
        </motion.div>

        {/* Revelações das Respostas */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="maternal-warmth rounded-2xl p-8 md:p-12 shadow-2xl fade-in mb-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-black text-primary mb-4 flex items-center justify-center">
              <Eye className="mr-3 w-8 h-8" />
              O QUE AS SUAS RESPOSTAS REVELARAM:
            </h3>
          </div>

          <div className="space-y-6">
            {revelacoes.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl"
              >
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <item.icon className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-red-800 text-lg mb-2">{index + 1}. {item.titulo}</h4>
                    <p className="text-red-700 leading-relaxed">{item.descricao}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* O Que Precisa Ser Feito */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="maternal-warmth rounded-2xl p-8 md:p-12 shadow-2xl fade-in mb-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-black text-primary mb-4 flex items-center justify-center">
              🎯 O QUE PRECISA SER FEITO URGENTEMENTE:
            </h3>
          </div>

          <div className="space-y-6">
            {fases.map((fase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl"
              >
                <div className="flex items-center mb-3">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold mr-4">
                    {fase.fase}
                  </div>
                  <h4 className="font-black text-blue-800 text-lg">{fase.titulo}</h4>
                  <span className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                    {fase.prazo}
                  </span>
                </div>
                <p className="text-blue-700 leading-relaxed">{fase.descricao}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* A Solução */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8 md:p-12 shadow-2xl fade-in mb-8"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl md:text-3xl font-black mb-4 flex items-center justify-center">
              💡 A SOLUÇÃO ESTÁ AQUI:
            </h3>
            <p className="text-lg leading-relaxed opacity-95">
              Eu tenho uma solução comprovada que já ajudou mais de <strong>1.400 casais</strong> a saírem exatamente dessa situação em que você está. É um método que desenvolvi especificamente para resolver esse problema em <strong className="text-yellow-300">apenas 7 dias</strong>, de forma prática e sem complicações.
            </p>
          </div>
        </motion.div>

        {/* Main Product */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="maternal-warmth rounded-2xl p-8 md:p-12 shadow-2xl fade-in mb-8"
        >
          <div className="text-center mb-10">
            <h3 className="text-3xl md:text-4xl font-black text-primary mb-4">
              ✨ CONHEÇA O "TRUQUE DA BRIGA ZERO"
            </h3>
            <p className="text-xl text-muted-foreground font-bold">
              O Método Que Elimina Brigas e Restaura a Paz Familiar em 7 Dias
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 mt-6">
              <p className="text-lg text-yellow-800 leading-relaxed">
                Depois de acompanhar seu diagnóstico, posso afirmar com certeza: <strong>você consegue resolver isso rapidamente</strong> se seguir o sistema certo.
              </p>
            </div>
          </div>

          <div className="mb-10">
            <h4 className="text-2xl font-black text-primary mb-6 text-center flex items-center justify-center">
              <Award className="mr-3 w-8 h-8" />
              🏆 O QUE VOCÊ VAI RECEBER:
            </h4>

            {/* Main Product */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl p-6 mb-8 border-2 border-yellow-400"
              data-testid="main-product"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <Zap className="text-primary w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold">✅ MÉTODO PRINCIPAL: Truque da Briga Zero</h3>
              </div>
              <ul className="space-y-2 text-white/95 ml-16">
                <li>• 3 fases estruturadas com 7 microetapas práticas</li>
                <li>• Técnicas para desarmar qualquer discussão em segundos</li>
                <li>• Como falar sem atacar e ser ouvida sem irritar</li>
                <li>• Protocolo para reparar danos já causados nos filhos</li>
              </ul>
            </motion.div>

            {/* Bonuses */}
            <div className="space-y-4 mb-10">
              {bonuses.map((bonus, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
                  className="bg-green-50 border border-green-200 rounded-xl p-4"
                  data-testid={`bonus-${index}`}
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-xl">{bonus.icon}</span>
                    </div>
                    <div>
                      <h5 className="font-black text-green-800 text-lg mb-1">✅ {bonus.titulo}</h5>
                      <p className="text-green-700">{bonus.descricao}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Emergency Price */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.7 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-xl p-8 mb-8 text-center border-4 border-red-500"
            data-testid="pricing-section"
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center justify-center">
              <span className="text-4xl mr-2">💰</span>
              INVESTIMENTO ESPECIAL:
            </h3>
            
            <div className="bg-white/90 backdrop-blur rounded-xl p-6 mb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="text-gray-500 text-xl line-through mr-4">De R$ 197,00</div>
                <div className="text-5xl font-black text-red-600">R$ 29,90</div>
              </div>
              <p className="text-lg text-gray-700 font-bold">
                Por que esse preço? Porque eu sei como é difícil viver em um lar sem paz. E sei que você já gastou muito mais tentando resolver isso de outras formas.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mt-6 mb-6">
              <div className="flex items-center justify-center bg-white/80 rounded-lg p-3">
                <Zap className="text-green-600 mr-2 w-5 h-5" />
                <span className="font-bold text-sm">⚡ ACESSO IMEDIATO</span>
              </div>
              <div className="flex items-center justify-center bg-white/80 rounded-lg p-3">
                <Shield className="text-blue-600 mr-2 w-5 h-5" />
                <span className="font-bold text-sm">💳 Parcele em 12x</span>
              </div>
              <div className="flex items-center justify-center bg-white/80 rounded-lg p-3">
                <Users className="text-purple-600 mr-2 w-5 h-5" />
                <span className="font-bold text-sm">📱 Todos dispositivos</span>
              </div>
            </div>
            
            {/* Botão Verde na Seção de Preço - Abre Popup */}
            <div className="flex justify-center">
              <button 
                onClick={handleOpenCheckout}
                id="oferta_29"
                data-testid="price-section-button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-green-600 hover:bg-green-700 text-white h-14 px-8 py-4 text-lg font-bold animate-pulse shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                🛒 QUERO SALVAR MEUS FILHOS AGORA - R$ 29,90
              </button>
            </div>
          </motion.div>

          {/* Guarantee */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.9 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6 mb-8 border-2 border-green-300"
            data-testid="guarantee-section"
          >
            <div className="flex items-center justify-center mb-4">
              <Shield className="text-white text-3xl mr-3" />
              <h3 className="text-2xl font-bold">🛡️ SUA GARANTIA INCONDICIONAL:</h3>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
              <h4 className="text-xl font-black text-yellow-300 mb-2">7 DIAS DE GARANTIA TOTAL</h4>
              <p className="text-lg leading-relaxed">
                Se em 7 dias você não ver uma transformação clara nas brigas, devolvemos cada centavo. Sem perguntas, sem questionamentos.
              </p>
            </div>
            <p className="text-lg text-center font-bold">
              Mas pense comigo: você prefere recuperar R$ 29,90 ou recuperar a paz da sua família?
            </p>
          </motion.div>

          {/* Urgência */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.1 }}
            className="bg-red-600 text-white rounded-xl p-6 mb-8"
          >
            <div className="text-center">
              <h3 className="text-2xl font-black mb-4 flex items-center justify-center">
                <Clock className="mr-3 w-8 h-8" />
                ⏰ URGÊNCIA REAL:
              </h3>
              <p className="text-lg leading-relaxed mb-4">
                Cada dia que passa é mais um dia de trauma para seus filhos. Cada briga que eles presenciam os programa para relacionamentos disfuncionais no futuro.
              </p>
              <p className="text-xl font-black text-yellow-300">
                Seus filhos estão contando com você. Não falhe com eles novamente.
              </p>
            </div>
          </motion.div>

          {/* Authority */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.3 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8"
            data-testid="authority-section"
          >
            <div className="flex items-start">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Users className="text-white w-8 h-8" />
              </div>
              <div>
                <p className="text-foreground italic text-lg leading-relaxed mb-3">
                  "Como conselheira matrimonial cristã e mãe, vi famílias inteiras destruídas por brigas que 
                  poderiam ter sido evitadas. Não deixe seus filhos se tornarem mais uma estatística. Aja 
                  enquanto ainda é tempo."
                </p>
                <div className="text-primary font-bold">
                  <p>- Patrícia Oliveira</p>
                  <p className="text-sm">Conselheira Matrimonial Cristã</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Call to Action Final */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.5 }}
            className="bg-destructive text-destructive-foreground rounded-xl p-6 mb-8 text-center"
          >
            <h3 className="text-2xl font-black mb-4">
              🚨 SUA FAMÍLIA NÃO PODE ESPERAR MAIS
            </h3>
            <p className="text-lg leading-relaxed mb-4">
              O diagnóstico está feito. A solução está aqui. Agora é só decidir: você vai continuar destruindo sua família com brigas ou vai ser a mãe corajosa que salva o futuro dos seus filhos?
            </p>
          </motion.div>

          {/* Final CTA - Abre Popup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.7 }}
          >
            <button 
              onClick={handleOpenCheckout}
              id="oferta_29"
              data-testid="checkout-button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-green-600 hover:bg-green-700 text-white h-14 px-8 py-4 text-lg font-bold animate-pulse shadow-2xl transform hover:scale-105 transition-all duration-300 w-full"
            >
              🛒 QUERO SALVAR MEUS FILHOS AGORA - R$ 29,90
            </button>
          </motion.div>

          {/* Thank you message */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.8 }}
            className="flex items-center justify-center mt-6 text-gray-600 text-sm"
            data-testid="thank-you-message"
          >
            <div className="text-center">
              Suas respostas foram registradas com sucesso.
            </div>
          </motion.div>
        </motion.div>
        
        {/* Popup de Checkout */}
        <CheckoutPopup 
          isOpen={isPopupOpen} 
          onClose={() => setIsPopupOpen(false)} 
        />
      </div>
    </div>
  );
}
