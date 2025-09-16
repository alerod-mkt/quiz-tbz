import { motion } from "framer-motion";
import { AlertTriangle, Check, Star } from "lucide-react";
import { Link } from "wouter";
import EmergencyButton from "@/components/EmergencyButton";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const benefits = [
    "O protocolo de emergência para parar as brigas antes que seja tarde demais",
    "Como desprogramar seus filhos dos traumas já causados pelas discussões",
    "As 3 frases que fazem qualquer marido parar na hora e te respeitar",
    "O método para ser ouvida sem destruir a paz da família",
    "Como transformar sua casa de campo de batalha em lar de paz"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-4xl w-full">
        {/* Emergency Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6 sm:mb-8 fade-in"
        >
          <motion.div 
            className="inline-flex items-center bg-destructive text-destructive-foreground px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold mb-3 sm:mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            data-testid="emergency-badge"
          >
            <AlertTriangle className="mr-2 w-3 sm:w-4 h-3 sm:h-4" />
            EMERGÊNCIA FAMILIAR
          </motion.div>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
            PARE! SUAS BRIGAS ESTÃO<br />
            <span className="text-destructive text-xl sm:text-3xl md:text-4xl lg:text-5xl">CONDENANDO SEUS FILHOS</span>
          </h1>
          
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white/90 mb-6 sm:mb-8 px-2 sm:px-0">
            Faça Este Diagnóstico Antes Que o Dano Se Torne Irreversível
          </h2>
        </motion.div>

        {/* Main Content Card */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="maternal-warmth rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl fade-in"
        >
          <p className="text-sm sm:text-base md:text-lg text-foreground mb-6 sm:mb-8 leading-relaxed">
            A cada briga que seus filhos presenciam, você os ensina que casamento é sofrimento. 
            Neurociência confirma: isso causa danos permanentes após os 12 anos. Este diagnóstico 
            revelará o nível de risco e gerará seu plano de resgate:
          </p>

          {/* Benefits List */}
          <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="flex items-start"
                data-testid={`benefit-${index}`}
              >
                <div className="w-5 sm:w-6 h-5 sm:h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 mt-0.5">
                  <Check className="text-white w-3 sm:w-4 h-3 sm:h-4" />
                </div>
                <span className="text-sm sm:text-base text-foreground font-medium leading-relaxed">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-accent rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 text-center"
            data-testid="social-proof"
          >
            <div className="flex items-center justify-center mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              <span className="font-bold text-primary">1.436 mães</span> já salvaram seus 
              casamentos e protegeram o futuro dos filhos
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <EmergencyButton onClick={onStart} id="CliqueIq">
              QUERO SALVAR MEUS FILHOS AGORA
            </EmergencyButton>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="mt-8 sm:mt-12 lg:mt-16 text-center px-2"
        >
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6 text-white/70 text-xs sm:text-sm">
            <p className="text-white font-medium text-center">© 2024 O Reino 360. Todos os direitos reservados.</p>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/termos-de-uso" 
                className="hover:text-white transition-colors duration-200 text-center"
                data-testid="link-terms"
              >
                Termos de Uso
              </Link>
              <span className="hidden sm:inline text-white/40">•</span>
              <Link 
                href="/politica-de-privacidade" 
                className="hover:text-white transition-colors duration-200 text-center"
                data-testid="link-privacy"
              >
                Política de Privacidade
              </Link>
              <span className="hidden sm:inline text-white/40">•</span>
              <Link 
                href="/politica-de-reembolso" 
                className="hover:text-white transition-colors duration-200 text-center"
                data-testid="link-refund"
              >
                Política de Reembolso
              </Link>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
