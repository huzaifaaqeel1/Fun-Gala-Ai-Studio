import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  RefreshCw,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { GeneratedAudioItem } from '../types/tts';

interface AudioPlayerProps {
  currentAudio: GeneratedAudioItem | null;
  onRegenerate?: () => void;
  className?: string;
  isInline?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentAudio,
  onRegenerate,
  className = '',
  isInline = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Playback speeds
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  useEffect(() => {
    if (audioRef.current && currentAudio?.audioUrl) {
      audioRef.current.src = currentAudio.audioUrl;
      audioRef.current.load();
      setCurrentTime(0);
      setIsPlaying(false);
      // Auto play on new audio generation
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Browser autoplay restrictions may prevent auto play
            setIsPlaying(false);
          });
      }
    }
  }, [currentAudio?.id, currentAudio?.audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current || !currentAudio) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (!isNaN(dur) && isFinite(dur)) {
        setDuration(dur);
      } else if (currentAudio?.duration) {
        setDuration(currentAudio.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration || 100);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) setIsMuted(true);
      else setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume > 0 ? volume : 0.8;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleDownload = () => {
    if (!currentAudio) return;
    const link = document.createElement('a');
    link.href = currentAudio.audioUrl;
    const sanitizedTitle = (currentAudio.title || 'generated-speech')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    link.download = `${sanitizedTitle}.${currentAudio.format || 'mp3'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentAudio) {
    return null;
  }

  // Waveform visualization bars count
  const waveBars = 32;

  return (
    <div
      className={`glass-panel-elevated rounded-2xl border border-violet-500/30 p-4 transition-all duration-300 ${
        isInline ? 'w-full shadow-2xl' : 'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-5xl shadow-2xl'
      } ${className}`}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Top row: Title, Voice & Tags */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/20">
            <Radio className={`h-5 w-5 ${isPlaying ? 'animate-pulse text-cyan-300' : 'text-white'}`} />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-white">
              {currentAudio.title || 'Generated Audio Speech'}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="font-medium text-violet-400">{currentAudio.voiceName}</span>
              <span>•</span>
              <span>{currentAudio.language} ({currentAudio.accent})</span>
              <span>•</span>
              <span className="uppercase text-[10px] tracking-wider text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                {currentAudio.format || 'MP3'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Regenerate & Download */}
        <div className="flex items-center space-x-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center space-x-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-violet-500/40 hover:bg-white/10 hover:text-white transition-colors"
              title="Regenerate with current settings"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-md transition-all ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/20'
            }`}
          >
            {downloadSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Download MP3</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Middle row: Interactive Waveform & Scrub Timeline */}
      <div className="mt-3 flex flex-col space-y-1.5">
        {/* Animated Soundwave Graphic */}
        <div className="flex items-center justify-between gap-1 px-1 py-1 h-8 opacity-75">
          {Array.from({ length: waveBars }).map((_, idx) => {
            const progress = (idx / waveBars) <= (currentTime / (duration || 1));
            // pseudo random heights
            const baseH = [12, 18, 28, 16, 22, 14, 26, 30, 20, 16, 24, 28, 14, 20, 16, 22][idx % 16];
            return (
              <div
                key={idx}
                className={`w-full rounded-full transition-all duration-150 ${
                  progress
                    ? 'bg-gradient-to-t from-violet-500 to-cyan-400'
                    : 'bg-slate-700/60'
                } ${isPlaying && progress ? 'animate-pulse' : ''}`}
                style={{
                  height: isPlaying ? `${Math.max(4, baseH * (progress ? 1 : 0.6))}px` : `${Math.max(4, baseH * 0.4)}px`,
                }}
              />
            );
          })}
        </div>

        {/* Timeline Slider */}
        <div className="flex items-center space-x-3">
          <span className="w-10 text-right text-xs font-mono text-slate-400">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-violet-500 focus:outline-none"
            />
          </div>
          <span className="w-10 text-left text-xs font-mono text-slate-400">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Bottom row: Controls, Speed, Volume */}
      <div className="mt-3 flex items-center justify-between">
        {/* Left: Playback rate picker */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center space-x-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <span>Speed: {playbackRate}x</span>
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-28 rounded-xl border border-white/10 bg-[#121624] p-1 shadow-2xl z-50">
              {speedOptions.map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  className={`flex w-full items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                    playbackRate === rate
                      ? 'bg-violet-600/30 text-violet-300 font-semibold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>{rate}x</span>
                  {playbackRate === rate && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Play, Rewind, Fast Forward Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => skipSeconds(-5)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={togglePlayPause}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          <button
            onClick={() => skipSeconds(5)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Forward 5 seconds"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Volume slider */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-rose-400" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="hidden sm:block h-1.5 w-20 cursor-pointer appearance-none rounded-lg bg-slate-800 accent-violet-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
