import React, { useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Sliders, Volume2, VolumeX, Maximize2, Minimize2, Disc } from 'lucide-react';
import { Track } from '../types';

interface PlayerBarProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onOpenTrackInfo: () => void;
  onOpenAmbient: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleMute,
  onVolumeChange,
  onOpenTrackInfo,
  onOpenAmbient,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 p-4 md:px-12 md:py-8 flex justify-center pointer-events-none select-none">
      <div className="glass-panel rounded-full w-full max-w-2xl px-5 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/10 pointer-events-auto transition-all duration-300">
        
        {/* Track Info (Left) - Clicking shows song and artist */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <button
            id="albumArtPlaceholder"
            onClick={onOpenTrackInfo}
            aria-label="View song and artist info"
            className="w-10 h-10 md:w-12 md:h-12 bg-neutral-900/80 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative group cursor-pointer flex items-center justify-center shadow-inner focus:outline-none"
            title="Click to view song & artist"
          >
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-60 flex items-center justify-center">
              <Disc className={`w-5 h-5 text-neutral-400 group-hover:text-white transition-transform duration-1000 ${isPlaying ? 'animate-spin' : ''}`} />
            </div>
          </button>

          <div className="truncate cursor-pointer" onClick={onOpenTrackInfo} title="Click to view song & artist">
            <h3 id="trackTitle" className="font-sans-body font-medium text-white text-sm md:text-[15px] truncate tracking-wide hover:text-white/90">
              {currentTrack.title}
            </h3>
            <p id="trackArtist" className="font-mono-code text-[10px] md:text-[11px] text-neutral-400 uppercase tracking-wider truncate hover:text-neutral-300">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Playback Controls (Center) */}
        <div className="flex items-center gap-4 md:gap-6 justify-center">
          <button
            id="prevBtn"
            onClick={onPrev}
            aria-label="Previous Track"
            className="text-neutral-400 hover:text-white transition-colors p-1 focus:outline-none"
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          <button
            id="playPauseBtn"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="text-black bg-white rounded-full w-9 h-9 md:w-10 md:h-10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_16px_rgba(255,255,255,0.25)] focus:outline-none"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            id="nextBtn"
            onClick={onNext}
            aria-label="Next Track"
            className="text-neutral-400 hover:text-white transition-colors p-1 focus:outline-none"
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>
        </div>

        {/* Progress Bar (Right) */}
        <div className="hidden sm:flex flex-1 items-center gap-3 min-w-[140px]">
          <span id="currentTime" className="font-mono-code text-[11px] text-neutral-400 w-9 text-right select-none">
            {formatTime(currentTime)}
          </span>

          <div
            id="progressBarContainer"
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            className="h-1 bg-white/20 hover:bg-white/30 rounded-full flex-1 relative cursor-pointer group py-1.5 -my-1.5 transition-colors"
          >
            <div className="h-1 bg-white/10 rounded-full w-full relative overflow-hidden">
              <div
                id="progressBar"
                className="h-full bg-white rounded-full progress-bar-fill relative"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Scrubber Knob */}
            <div
              id="progressHandle"
              className="absolute h-3 w-3 bg-white rounded-full top-1/2 -translate-y-1/2 -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <span id="totalTime" className="font-mono-code text-[11px] text-neutral-400 w-9 text-left select-none">
            {formatTime(duration)}
          </span>
        </div>

        {/* Additional Floating Utilities */}
        <div className="flex items-center gap-1.5 md:gap-2 text-neutral-400">
          <button
            onClick={onOpenAmbient}
            aria-label="Ambient soundscapes"
            className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Ambient sound mixer"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            aria-label="Toggle mute"
            className="p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="hidden md:block p-1.5 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Fullscreen immersion"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </nav>
  );
};
