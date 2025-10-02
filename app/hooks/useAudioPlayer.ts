import { useState, useEffect } from 'react';
import Hls from 'hls.js';
import { Radio } from '@/lib/mock-data';
import { useEnhancedToast } from './use-enhanced-toast';

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
      console.warn('Error limpiando audio:', error);
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
      console.log(`⏹️ Detenido: ${radio.name}`);
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
    console.log(`🎵 Intentando reproducir: ${radio.name}`);
    console.log(`🔗 URL: ${radio.streamUrl}`);

    try {
      const url = radio.streamUrl?.trim();
      if (!url) throw new Error("URL de streaming vacía");

      // Detectar tipo de stream
      const isHls = url.endsWith(".m3u8");
      const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
      const isTwitch = url.includes("twitch.tv");
      const isFacebook = url.includes("facebook.com");

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
          console.log(`✅ Reproduciendo HLS: ${radio.name}`);
          toast.audioSuccess(`Reproduciendo: ${radio.name}`);
        });

        video.addEventListener("error", (err) => {
          console.error("❌ Error HLS:", err);
          setIsLoading(null);
          setPlayingRadio(null);
          toast.audioError(`Error HLS: No se pudo reproducir ${radio.name}`);
        });

        setAudioElement(video);
        return;
      }

      // Caso: streams normales (MP3/AAC/OGG)
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.volume = 0.7;

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
            console.log(`✅ Reproduciendo: ${radio.name}`);
            toast.audioSuccess(`Reproduciendo: ${radio.name}`);
          })
          .catch(error => {
            console.error("❌ Error reproduciendo:", error);
            toast.audioError(`No se pudo reproducir ${radio.name}`);
            setPlayingRadio(null);
          });
      };

      const onError = (event: any) => {
        clearTimeout(timeout);
        console.error(`❌ Error cargando ${radio.name}:`, event);
        setIsLoading(null);
        setPlayingRadio(null);
        cleanupAudio(audio);
        setAudioElement(null);
        toast.audioError(`Error: No se pudo cargar ${radio.name}`);
      };

      const onEnded = () => {
        setPlayingRadio(null);
        cleanupAudio(audio);
        setAudioElement(null);
        console.log(`🔚 Stream finalizado: ${radio.name}`);
      };

      audio.addEventListener("canplay", onCanPlay, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.addEventListener("ended", onEnded, { once: true });

      audio.src = url;
      audio.load();

      setAudioElement(audio);

    } catch (error) {
      console.error("❌ Error configurando audio:", error);
      toast.audioError(`Error configurando reproductor para ${radio.name}`);
      setIsLoading(null);
      setPlayingRadio(null);
    }
  };

  return {
    playingRadio,
    isLoading,
    handlePlay,
  };
}
