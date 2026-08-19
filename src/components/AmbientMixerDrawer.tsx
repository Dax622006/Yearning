import React from 'react';
import { X, CloudRain, Disc, Image as ImageIcon, Sliders, Sparkles } from 'lucide-react';
import { BackgroundScene } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AmbientMixerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vinylEnabled: boolean;
  vinylVolume: number;
  onToggleVinyl: () => void;
  onChangeVinylVolume: (vol: number) => void;
  rainEnabled: boolean;
  rainVolume: number;
  onToggleRain: () => void;
  onChangeRainVolume: (vol: number) => void;
  scenes: BackgroundScene[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  showFilmGrain: boolean;
  onToggleFilmGrain: () => void;
  showVignette: boolean;
  onToggleVignette: () => void;
}

export const AmbientMixerDrawer: React.FC<AmbientMixerDrawerProps> = ({
  isOpen,
  onClose,
  vinylEnabled,
  vinylVolume,
  onToggleVinyl,
  onChangeVinylVolume,
  rainEnabled,
  rainVolume,
  onToggleRain,
  onChangeRainVolume,
  scenes,
  activeSceneId,
  onSelectScene,
  showFilmGrain,
  onToggleFilmGrain,
  showVignette,
  onToggleVignette,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-md h-full glass-modal border-l border-white/10 p-6 flex flex-col justify-between text-white overflow-y-auto"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-neutral-300" />
                  <h3 className="font-serif-display text-xl font-medium tracking-wide">
                    Atmosphere & Mixer
                  </h3>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close mixer"
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ambient Sound Layer Controls */}
              <div className="space-y-4 mb-8">
                <h4 className="font-sans-body text-xs text-neutral-400 uppercase tracking-widest font-medium">
                  Soundscape Overlays
                </h4>

                {/* Vinyl Crackle */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${vinylEnabled ? 'bg-white text-black' : 'bg-white/5 text-neutral-400'}`}>
                        <Disc className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-sans-body text-sm font-medium text-white">Vintage Vinyl Crackle</p>
                        <p className="font-mono-code text-[10px] text-neutral-400">Warm needle noise & pops</p>
                      </div>
                    </div>

                    <button
                      onClick={onToggleVinyl}
                      className={`px-3 py-1 rounded-full text-xs font-mono-code transition ${
                        vinylEnabled ? 'bg-white text-black' : 'bg-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {vinylEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {vinylEnabled && (
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-mono-code text-neutral-400 mb-1">
                        <span>Intensity</span>
                        <span>{Math.round(vinylVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vinylVolume}
                        onChange={(e) => onChangeVinylVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  )}
                </div>

                {/* Soft Rainfall */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${rainEnabled ? 'bg-white text-black' : 'bg-white/5 text-neutral-400'}`}>
                        <CloudRain className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-sans-body text-sm font-medium text-white">Nocturnal Rain</p>
                        <p className="font-mono-code text-[10px] text-neutral-400">Gentle precipitation</p>
                      </div>
                    </div>

                    <button
                      onClick={onToggleRain}
                      className={`px-3 py-1 rounded-full text-xs font-mono-code transition ${
                        rainEnabled ? 'bg-white text-black' : 'bg-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {rainEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {rainEnabled && (
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-mono-code text-neutral-400 mb-1">
                        <span>Intensity</span>
                        <span>{Math.round(rainVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={rainVolume}
                        onChange={(e) => onChangeRainVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Background Cinematics */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans-body text-xs text-neutral-400 uppercase tracking-widest font-medium">
                    Cinematic Stills
                  </h4>
                  <span className="font-mono-code text-[10px] text-neutral-400">{scenes.length} Scenes</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {scenes.map((scene) => {
                    const isSelected = scene.id === activeSceneId;
                    return (
                      <button
                        key={scene.id}
                        onClick={() => onSelectScene(scene.id)}
                        className={`group relative rounded-xl overflow-hidden aspect-video border text-left transition-all ${
                          isSelected ? 'border-white ring-2 ring-white/30' : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={scene.imageUrl}
                          alt={scene.title}
                          className="w-full h-full object-cover filter grayscale contrast-125"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end">
                          <p className="font-sans-body text-[11px] text-white font-medium truncate">{scene.title}</p>
                          {scene.film && (
                            <p className="font-mono-code text-[9px] text-neutral-400">{scene.film} {scene.year ? `(${scene.year})` : ''}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Texture Toggles */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <h4 className="font-sans-body text-xs text-neutral-400 uppercase tracking-widest font-medium mb-2">
                  Visual FX
                </h4>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-neutral-300 font-sans-body">35mm Film Grain</span>
                  <button
                    onClick={onToggleFilmGrain}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-code ${
                      showFilmGrain ? 'bg-white text-black' : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {showFilmGrain ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-neutral-300 font-sans-body">Cinematic Vignette</span>
                  <button
                    onClick={onToggleVignette}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-code ${
                      showVignette ? 'bg-white text-black' : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {showVignette ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>

            <p className="font-mono-code text-[10px] text-neutral-400 text-center pt-6">
              Longing made audible.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
