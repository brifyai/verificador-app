import { useState, useEffect } from 'react';
import Hls from 'hls.js';
import { Radio } from '@/lib/mock-data';
import { useEnhancedToast } from './use-enhanced-toast';
import { logger } from '@/lib/logger';

export function useAudioPlayer() {
  const [playingRadio, setPlayingRadio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const toast = useEnhancedToast();

  // Limpiar audio al desmontar
  useEffect(() => {
    return () => {
      if (audioElement) {
        cleanupAudio(audioElement);
      }
    };
  }, [audioElement]);

  const cleanupAudio = (audio: HTMLAudioElement | HTMLVideoElement) => {
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      
      const events = ['canplay', 'error', 'ended', 'loadstart', 'loadeddata', 'loadedmetadata', 'playing'];
      events.forEach(event => {
        audio.removeEventListener(event, () => {});
      });
    } catch (error) {
      logger.warn('Error limpiando audio:', error);
    }
  };

  const handlePlay = async (radio: Radio) => {
    // Si ya está reproduciendo esta radio, detener
    if (playingRadio === radio.id) {
      if (audioElement) {
        cleanupAudio(audioElement);
        setAudioElement(null);
      }
      setPlayingRadio(null);
      setIsLoading(null);
      logger.log(`⏹️ Detenido: ${radio.name}`);
      return;
    }

    // Si hay otro audio reproduciéndose, detenerlo
    if (audioElement) {
      cleanupAudio(audioElement);
      setAudioElement(null);
    }

    // Verificar si la radio está activa
    if (!radio.isActive) {
      toast.warning('Esta radio no está activa. Actívala primero para poder escucharla.');
      return;
    }

    setIsLoading(radio.id);
    logger.log(`🎵 Intentando reproducir: ${radio.name}`);
    logger.log(`🔗 URL: ${radio.streamUrl}`);

    try {
      const url = radio.streamUrl?.trim();
      if (!url) throw new Error("URL de streaming vacía");

      // Detectar tipo de stream (mejorado)
      const isHls = url.includes(".m3u8") || url.includes("/hls/");
      const isDash = url.includes(".mpd");
      const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
      const isTwitch = url.includes("twitch.tv");
      const isFacebook = url.includes("facebook.com");
      const isIcecast = url.includes(":8000") || url.includes("icecast");
      const isShoutcast = url.includes(":8080") || url.includes("shoutcast");

      // Caso: YouTube / Twitch / Facebook
      if (isYouTube || isTwitch || isFacebook) {
        setIsLoading(null);
        setPlayingRadio(null);
        toast.info(`🎥 ${radio.name} se reproduce en reproductor externo (${isYouTube ? "YouTube" : isTwitch ? "Twitch" : "Facebook"})`);
        return;
      }

      // Caso: HLS (.m3u8)
      if (isHls && Hls.isSupported()) {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.volume = 0.7;
        video.controls = false;
        video.autoplay = true;

        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);

        video.addEventListener("playing", () => {
          setIsLoading(null);
          setPlayingRadio(radio.id);
          logger.log(`✅ Reproduciendo HLS: ${radio.name}`);
          toast.audioSuccess(`Reproduciendo: ${radio.name}`);
        });

        video.addEventListener("error", (err) => {
          logger.error("❌ Error HLS:", err);
          setIsLoading(null);
          setPlayingRadio(null);
          toast.audioError(`Error HLS: No se pudo reproducir ${radio.name}`);
        });

        setAudioElement(video);
        return;
      }

      // Caso: streams normales (MP3/AAC/OGG/Icecast/Shoutcast)
      const audio = new Audio();
      audio.preload = "metadata";
      audio.volume = 0.7;
      
      // Usar proxy para streams Icecast/Shoutcast o problemáticos
      let finalUrl = url;
      if (isIcecast || isShoutcast || url.startsWith('http://')) {
        // Usar proxy para resolver CORS y otros problemas
        finalUrl = `/api/proxy-stream?url=${encodeURIComponent(url)}`;
        logger.log(`🎙️ Usando proxy para stream: ${radio.name}`);
      } else {
        // Para HTTPS, intentar directo primero
        audio.crossOrigin = "anonymous";
      }

      const timeout = setTimeout(() => {
        toast.error(`⏰ Tiempo agotado cargando ${radio.name}`);
        setIsLoading(null);
        audio.src = "";
      }, 15000);

      const onCanPlay = () => {
        clearTimeout(timeout);
        setIsLoading(null);
        setPlayingRadio(radio.id);
        audio.play()
          .then(() => {
            logger.log(`✅ Reproduciendo: ${radio.name}`);
            toast.audioSuccess(`Reproduciendo: ${radio.name}`);
          })
          .catch(error => {
            logger.error("❌ Error reproduciendo:", error);
            toast.audioError(`No se pudo reproducir ${radio.name}`);
            setPlayingRadio(null);
          });
      };

      const onError = (event: any) => {
        clearTimeout(timeout);
        logger.error(`❌ Error cargando ${radio.name}:`, event);
        
        // Intentar con método alternativo si falla
        logger.log(`🔄 Intentando método alternativo para ${radio.name}`);
        tryAlternativeMethod(audio, url, radio);
        
        setIsLoading(null);
        setPlayingRadio(null);
        cleanupAudio(audio);
        setAudioElement(null);
        console.warn(`Audio no disponible para ${radio.name}, pero la grabación puede funcionar`);
      };

      const onEnded = () => {
        setPlayingRadio(null);
        cleanupAudio(audio);
        setAudioElement(null);
        logger.log(`🔚 Stream finalizado: ${radio.name}`);
      };

      audio.addEventListener("canplay", onCanPlay, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.addEventListener("ended", onEnded, { once: true });

      audio.src = finalUrl; // Usar finalUrl (puede ser proxy o directo)
      audio.load();

      setAudioElement(audio);

    } catch (error) {
      logger.error("❌ Error configurando audio:", error);
      toast.audioError(`Error configurando reproductor para ${radio.name}`);
      setIsLoading(null);
      setPlayingRadio(null);
    }
  };

  // Método alternativo para streams problemáticos
  const tryAlternativeMethod = (audio: HTMLAudioElement, url: string, radio: Radio) => {
    try {
      // Intentar sin crossOrigin
      audio.removeAttribute('crossOrigin');
      audio.src = url;
      audio.load();
      
      audio.addEventListener('canplay', () => {
        audio.play()
          .then(() => {
            logger.log(`✅ Reproduciendo con método alternativo: ${radio.name}`);
            toast.audioSuccess(`Reproduciendo: ${radio.name}`);
            setPlayingRadio(radio.id);
          })
          .catch(err => {
            logger.error('Error en método alternativo:', err);
          });
      }, { once: true });
    } catch (err) {
      logger.error('Error en método alternativo:', err);
    }
  };

  return {
    playingRadio,
    isLoading,
    handlePlay,
  };
}
