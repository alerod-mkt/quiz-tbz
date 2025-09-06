import { motion } from "framer-motion";
import { Play, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import EmergencyButton from "@/components/EmergencyButton";

interface VSLPageProps {
  onContinue: () => void;
}

export default function VSLPage({ onContinue }: VSLPageProps) {
  // Estado para controlar quando mostrar o botão
  const [showButton, setShowButton] = useState(false);
  
  // Simula duração do vídeo (em segundos)
  const VIDEO_DURATION = 30; // 30 segundos (para teste)
  const BUTTON_SHOW_TIME = 10; // Mostrar botão 10 segundos antes do fim
  
  useEffect(() => {
    // Timer para mostrar o botão 30 segundos antes do vídeo acabar
    const timer = setTimeout(() => {
      setShowButton(true);
    }, (VIDEO_DURATION - BUTTON_SHOW_TIME) * 1000);
    
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-20">
      <div className="max-w-4xl w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="maternal-warmth rounded-2xl p-8 md:p-12 shadow-2xl fade-in"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-primary mb-4">
              SEU DIAGNÓSTICO ESTÁ PRONTO - ASSISTA URGENTE
            </h2>
            <p className="text-lg text-muted-foreground">
              Descubra o nível de risco dos seus filhos e como reverter os danos
            </p>
          </motion.div>

          {/* VSL Video Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            id="mini-vsl-container" 
            className="bg-black rounded-xl mb-8 aspect-video flex items-center justify-center"
            data-testid="vsl-container"
          >
            <div className="text-center text-white">
              <Play className="w-16 h-16 mb-4 mx-auto opacity-70" />
              <p className="text-lg">Container para Vídeo VSL</p>
              <p className="text-sm opacity-70">Integração com player de vídeo</p>
            </div>
          </motion.div>

          {/* Warning Text */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg"
            data-testid="warning-text"
          >
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="inline mr-2 w-4 h-4" />
                  <strong>ATENÇÃO:</strong> Este vídeo contém informações científicas sobre os danos 
                  permanentes que brigas causam em crianças. Assista até o final para descobrir como 
                  proteger seus filhos.
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA Button - só aparece quando showButton é true */}
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <EmergencyButton onClick={onContinue} isPulse>
                QUERO SALVAR MEUS FILHOS AGORA
              </EmergencyButton>
            </motion.div>
          )}
          
          {/* Texto indicativo quando botão não está visível */}
          {!showButton && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground text-sm"
            >
              <p>Assista ao vídeo completo para continuar...</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
