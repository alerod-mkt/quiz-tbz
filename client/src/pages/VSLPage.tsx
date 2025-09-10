import { motion } from "framer-motion";
import { Play, Pause, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import EmergencyButton from "@/components/EmergencyButton";
import videoSrc from '@assets/como parar com as brigas no casamento.mp4';

interface VSLPageProps {
  onContinue: () => void;
}

export default function VSLPage({ onContinue }: VSLPageProps) {
  // Estado para controlar quando mostrar o botão
  const [showButton, setShowButton] = useState(false);
  // Estado para a barra de progresso
  const [progress, setProgress] = useState(0);
  // Estado para controlar interação e controles
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Configuração de tempo para VSL (3 minutos)
  const TOTAL_DURATION = 180; // 3 minutos em segundos
  const BUTTON_SHOW_TIME = 10; // Mostrar botão 10 segundos antes do fim
  
  // Timer para mostrar o botão baseado no tempo real do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration || TOTAL_DURATION;
      
      // Mostrar botão quando faltam exatamente 10 segundos para o fim
      const timeRemaining = duration - currentTime;
      if (timeRemaining <= BUTTON_SHOW_TIME && timeRemaining > 0 && !showButton) {
        console.log(`⏰ VSL: Faltam ${timeRemaining.toFixed(1)}s, mostrando botão`);
        setShowButton(true);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [showButton]);
  
  // Barra de progresso inteligente VSL - Sincronização PERFEITA
  useEffect(() => {
    const updateProgress = () => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration || TOTAL_DURATION;
        const realProgress = (currentTime / duration) * 100;
        
        // Algoritmo VSL com sincronização matemática perfeita
        let visualProgress;
        
        if (realProgress <= 25) {
          // Primeiros 25% - MUITO RÁPIDO 
          // 25% real = 60% visual
          visualProgress = (realProgress / 25) * 60;
        } else if (realProgress <= 50) {
          // 25% a 50% - RÁPIDO
          // 25% real = 25% visual (de 60% para 85%)
          const segmentProgress = (realProgress - 25) / 25;
          visualProgress = 60 + (segmentProgress * 25);
        } else if (realProgress <= 80) {
          // 50% a 80% - NORMAL
          // 30% real = 12% visual (de 85% para 97%)
          const segmentProgress = (realProgress - 50) / 30;
          visualProgress = 85 + (segmentProgress * 12);
        } else {
          // 80% a 100% - LENTO
          // 20% real = 3% visual (de 97% para 100%)
          const segmentProgress = (realProgress - 80) / 20;
          visualProgress = 97 + (segmentProgress * 3);
        }
        
        // Garantir limites e sincronização perfeita
        setProgress(Math.min(Math.max(visualProgress, 0), 100));
      }
    };
    
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', updateProgress);
      return () => video.removeEventListener('timeupdate', updateProgress);
    }
  }, []);
  
  // Controlar volume programaticamente
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);



  // Toggle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Toggle volume slider visibility
  const toggleVolumeSlider = () => {
    setShowVolumeSlider(!showVolumeSlider);
  };

  // Ajustar volume
  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Controlar play/pause do vídeo
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        if (!hasInteracted) {
          setHasInteracted(true);
        }
      }
    }
  };

  // Eventos do vídeo HTML5
  const handleVideoPlay = () => {
    setIsPlaying(true);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleVideoEnded = () => {
    setProgress(100);
    setIsPlaying(false);
  };
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
            className="rounded-xl mb-8 aspect-video overflow-hidden border-4 border-blue-400 shadow-lg"
            data-testid="vsl-container"
          >
            <div className="relative w-full h-full">
              {/* Player de vídeo personalizado com borda moderna */}
              <video
                ref={videoRef}
                className="w-full h-full rounded-xl object-cover"
                src={videoSrc}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
                muted={isMuted}
                controls={false}
                playsInline
                preload="metadata"
                style={{
                  border: '3px solid transparent',
                  backgroundImage: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'content-box, border-box',
                  borderRadius: '12px'
                }}
              />
              
              {/* Botão de Play Central Vermelho */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <button
                    onClick={togglePlayPause}
                    className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-700 hover:via-red-600 hover:to-red-700 text-white rounded-full p-6 shadow-2xl transform transition-all duration-300 hover:scale-110 border-3 border-red-400 group"
                    data-testid="button-play-video"
                  >
                    <Play className="w-12 h-12 text-white ml-1" fill="white" />
                  </button>
                </div>
              )}

              {/* Área clicável para pause - apenas na área central */}
              {isPlaying && (
                <div 
                  className="absolute top-16 left-4 right-24 bottom-16 cursor-pointer z-10"
                  onClick={togglePlayPause}
                />
              )}

              {/* Controles personalizados - sempre visíveis */}
              <div 
                className="absolute inset-0 group z-0 pointer-events-none"
              >

                {/* Controles profissionais no canto superior direito - sempre visíveis */}
                <div 
                  className="absolute top-4 right-4 flex gap-2 z-40 pointer-events-auto"
                >
                  {/* Controle de Volume */}
                  <div 
                    className={`flex items-center gap-2 bg-black bg-opacity-80 rounded-full px-3 py-2 pointer-events-auto transition-all duration-300 ${
                      showVolumeSlider ? 'w-auto' : 'w-auto'
                    }`}
                  >
                    <button 
                      onClick={toggleVolumeSlider}
                      className="text-white hover:text-blue-400 transition-colors pointer-events-auto"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    {showVolumeSlider && (
                      <>
                        <button 
                          onClick={toggleMute}
                          className="text-white hover:text-red-400 transition-colors pointer-events-auto text-xs"
                        >
                          {isMuted ? 'ON' : 'OFF'}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => changeVolume(parseFloat(e.target.value))}
                          className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer pointer-events-auto"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, #6b7280 ${(isMuted ? 0 : volume) * 100}%, #6b7280 100%)`
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Barra de progresso moderna - sempre visível */}
              {progress > 0 && (
                <div className="absolute bottom-4 left-4 right-4 h-2 bg-gray-300 bg-opacity-60 rounded-full shadow-sm backdrop-blur-sm" style={{ zIndex: 30 }}>
                  <div 
                    className="h-full bg-gray-500 transition-all duration-100 ease-linear rounded-full"
                    style={{ 
                      width: `${progress}%`
                    }}
                  ></div>
                  {/* Indicador de posição discreto */}
                  <div 
                    className="absolute top-0 w-3 h-3 bg-gray-600 rounded-full shadow-md -translate-y-0.5 transition-all duration-100 ease-linear"
                    style={{ 
                      left: `calc(${progress}% - 6px)`
                    }}
                  ></div>
                </div>
              )}
              
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

          {/* CTA Button Profissional - só aparece quando showButton é true */}
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              {/* Efeito de brilho de fundo */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 to-green-600 rounded-xl blur-xl opacity-75 animate-pulse"></div>
              
              {/* Botão principal com design premium */}
              <button
                onClick={onContinue}
                id="view_oferta"
                className="relative w-full bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl py-3 sm:py-4 md:py-6 px-4 sm:px-6 md:px-8 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-green-500/50 border-2 border-green-400 group overflow-hidden"
                data-testid="button-continue-emergency"
              >
                {/* Efeito de brilho animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                {/* Ícone de urgência */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-pulse" />
                  <span className="relative z-10">QUERO SALVAR MEUS FILHOS AGORA</span>
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-pulse" />
                </div>
                
                {/* Texto adicional */}
                <div className="text-xs sm:text-sm mt-2 opacity-90 font-normal">
                  🔒 Acesso Imediato | Método Comprovado | 100% Garantizado
                </div>
              </button>
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
