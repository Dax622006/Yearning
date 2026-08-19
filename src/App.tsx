import React, { useState, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import { Track, BackgroundScene } from './types';
import { INITIAL_PLAYLIST, BACKGROUND_SCENES, shufflePlaylist } from './data/tracks';
import { soundEngine } from './services/soundEngine';
import { PlayerBar } from './components/PlayerBar';
import { InfoModal } from './components/InfoModal';
import { NowPlayingModal } from './components/NowPlayingModal';
import { AmbientMixerDrawer } from './components/AmbientMixerDrawer';

export default function App() {
  // Shuffled once on page load for each user session
  const [playlist] = useState<Track[]>(() => shufflePlaylist(INITIAL_PLAYLIST));
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(INITIAL_PLAYLIST[0].duration);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals & Drawers
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isAmbientOpen, setIsAmbientOpen] = useState(false);

  // Ambient & Visuals
  const [scenes] = useState<BackgroundScene[]>(BACKGROUND_SCENES);
  const [activeSceneId, setActiveSceneId] = useState(BACKGROUND_SCENES[0].id);
  const [vinylEnabled, setVinylEnabled] = useState(false);
  const [vinylVolume, setVinylVolume] = useState(0.2);
  const [rainEnabled, setRainEnabled] = useState(false);
  const [rainVolume, setRainVolume] = useState(0.25);
  const [showFilmGrain, setShowFilmGrain] = useState(true);
  const [showVignette, setShowVignette] = useState(true);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];
  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  const handlePlayTrack = useCallback(async (index: number) => {
    if (index < 0 || index >= playlist.length) return;
    const track = playlist[index];
    setCurrentTrackIndex(index);
    setDuration(track.duration);
    setCurrentTime(0);
    setIsPlaying(true);
    await soundEngine.playTrack(track, 0);
  }, [playlist]);

  const handleNextTrack = useCallback(() => {
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    handlePlayTrack(nextIdx);
  }, [currentTrackIndex, playlist.length, handlePlayTrack]);

  const handlePrevTrack = useCallback(() => {
    const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    handlePlayTrack(prevIdx);
  }, [currentTrackIndex, playlist.length, handlePlayTrack]);

  // Callback from soundEngine (purely for time & track completion)
  useEffect(() => {
    soundEngine.setCallbacks(
      (time, dur) => {
        setCurrentTime(time);
        if (dur && !isNaN(dur) && dur > 0) {
          setDuration(dur);
        }
      },
      () => {
        // Track naturally ended, advance to next track in session sequence
        handleNextTrack();
      }
    );
  }, [handleNextTrack]);

  const handleTogglePlay = useCallback(async () => {
    if (isPlaying) {
      soundEngine.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (currentTime > 0) {
        soundEngine.resume(currentTrack, currentTime);
      } else {
        await soundEngine.playTrack(currentTrack, 0);
      }
    }
  }, [isPlaying, currentTrack, currentTime]);

  const handleSeek = (secs: number) => {
    setCurrentTime(secs);
    soundEngine.seek(currentTrack, secs);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      soundEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      soundEngine.setVolume(0);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (isMuted && vol > 0) {
      setIsMuted(false);
    }
    soundEngine.setVolume(vol);
  };

  const handleToggleVinyl = () => {
    const nextState = !vinylEnabled;
    setVinylEnabled(nextState);
    soundEngine.setVinyl(nextState, vinylVolume);
  };

  const handleChangeVinylVolume = (vol: number) => {
    setVinylVolume(vol);
    if (vinylEnabled) {
      soundEngine.setVinyl(true, vol);
    }
  };

  const handleToggleRain = () => {
    const nextState = !rainEnabled;
    setRainEnabled(nextState);
    soundEngine.setRain(nextState, rainVolume);
  };

  const handleChangeRainVolume = (vol: number) => {
    setRainVolume(vol);
    if (rainEnabled) {
      soundEngine.setRain(true, vol);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'KeyN':
          e.preventDefault();
          handleNextTrack();
          break;
        case 'KeyP':
          e.preventDefault();
          handlePrevTrack();
          break;
        case 'KeyM':
          e.preventDefault();
          handleToggleMute();
          break;
        case 'KeyI':
          e.preventDefault();
          setIsInfoOpen((prev) => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        case 'Escape':
          setIsInfoOpen(false);
          setIsNowPlayingOpen(false);
          setIsAmbientOpen(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleNextTrack, handlePrevTrack, currentTime, duration]);

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#050505] text-white">
      {/* Background Image Container */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center w-full h-full transform scale-100 filter grayscale contrast-110"
          style={{
            backgroundImage: `url('${activeScene.imageUrl}')`,
          }}
        />

        {/* Ambient Dark Overlay */}
        <div
          className="absolute inset-0 bg-black/40"
          style={{ opacity: activeScene.overlayOpacity }}
        />

        {/* Optional Vignette */}
        {showVignette && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.75)_100%)] pointer-events-none" />
        )}

        {/* 35mm Film Grain */}
        {showFilmGrain && (
          <div className="absolute inset-0 film-grain pointer-events-none opacity-30 mix-blend-overlay" />
        )}
      </div>

      {/* Top Header / Info Button */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-end items-center px-6 py-6 md:px-12 md:py-8 bg-transparent pointer-events-none">
        <button
          id="infoBtn"
          onClick={() => setIsInfoOpen(true)}
          aria-label="About Yearning"
          className="text-white/60 hover:text-white transition-opacity duration-300 p-2.5 rounded-full hover:bg-white/10 focus:outline-none pointer-events-auto backdrop-blur-sm"
          title="About"
        >
          <Info className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </header>

      {/* Floating Bottom Music Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        onToggleMute={handleToggleMute}
        onVolumeChange={handleVolumeChange}
        onOpenTrackInfo={() => setIsNowPlayingOpen(true)}
        onOpenAmbient={() => setIsAmbientOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      {/* Now Playing Song & Artist Modal */}
      <NowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        track={currentTrack}
        isPlaying={isPlaying}
      />

      {/* Atmosphere & Ambient Mixer Drawer */}
      <AmbientMixerDrawer
        isOpen={isAmbientOpen}
        onClose={() => setIsAmbientOpen(false)}
        vinylEnabled={vinylEnabled}
        vinylVolume={vinylVolume}
        onToggleVinyl={handleToggleVinyl}
        onChangeVinylVolume={handleChangeVinylVolume}
        rainEnabled={rainEnabled}
        rainVolume={rainVolume}
        onToggleRain={handleToggleRain}
        onChangeRainVolume={handleChangeRainVolume}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSelectScene={(id) => setActiveSceneId(id)}
        showFilmGrain={showFilmGrain}
        onToggleFilmGrain={() => setShowFilmGrain((prev) => !prev)}
        showVignette={showVignette}
        onToggleVignette={() => setShowVignette((prev) => !prev)}
      />
    </main>
  );
}
