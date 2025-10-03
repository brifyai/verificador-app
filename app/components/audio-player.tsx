
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Clock,
  Radio,
  FileAudio
} from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  radioName: string;
  phrase: string;
  timestamp: string;
  duration?: number;
  transcription?: string;
  onDownload?: () => void;
}

export default function AudioPlayer({
  audioUrl,
  title,
  radioName,
  phrase,
  timestamp,
  duration,
  transcription,
  onDownload
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Error cargando el audio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      setError('Error reproduciendo el audio');
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMutedState = !isMuted;
    audio.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(event.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    } else if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * totalDuration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(totalDuration, currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-white text-lg flex items-center gap-2 mb-2">
              <FileAudio className="h-5 w-5 text-blue-400" />
              {title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="text-blue-300 border-blue-500">
                <Radio className="h-3 w-3 mr-1" />
                {radioName}
              </Badge>
              <Badge variant="outline" className="text-green-300 border-green-500">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(timestamp).toLocaleString('es-CL')}
              </Badge>
            </div>
            <div className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded">
              <strong>Frase:</strong> "{phrase}"
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {onDownload && (
              <Button
                onClick={onDownload}
                variant="outline"
                size="sm"
                className="text-slate-300 border-slate-600 hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <audio 
          ref={audioRef} 
          src={audioUrl}
          preload="metadata"
        />

        {/* Controles principales */}
        <div className="space-y-4">
          {/* Barra de progreso */}
          <div className="space-y-2">
            <div 
              ref={progressRef}
              className="w-full h-2 bg-slate-700 rounded-full cursor-pointer relative overflow-hidden"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
              <div 
                className="absolute top-0 w-3 h-3 bg-blue-400 rounded-full transform -translate-y-0.5 -translate-x-1.5 transition-all duration-100"
                style={{ left: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Controles de reproducción */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => skipTime(-10)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isLoading}
            >
              <SkipBack className="h-4 w-4" />
              <span className="ml-1 text-xs">10s</span>
            </Button>
            <Button
              onClick={togglePlay}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
              disabled={isLoading || error !== null}
            >
              {isLoading ? (
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
              ) : isPlaying ? (
                <Pause className="h-8 w-8 text-white" />
              ) : (
                <Play className="h-8 w-8 text-white" />
              )}
            </Button>
            <Button
              onClick={() => skipTime(10)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isLoading}
            >
              <span className="mr-1 text-xs">10s</span>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Control de volumen */}
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:bg-slate-700 p-2"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 volume-slider"
              style={{ '--volume-percentage': `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
            />
            <span className="text-xs text-slate-400 w-8">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="text-center text-red-400 text-sm bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          {/* Transcripción */}
          {transcription && (
            <div className="mt-4 p-3 bg-slate-700/30 rounded">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Transcripción:</h4>
              <p className="text-sm text-slate-200">{transcription}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
