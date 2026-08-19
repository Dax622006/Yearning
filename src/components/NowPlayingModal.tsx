import React from 'react';
import { X, Disc, Music } from 'lucide-react';
import { Track } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  isPlaying: boolean;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 w-full max-w-sm glass-modal rounded-3xl border border-white/15 p-7 md:p-8 flex flex-col items-center text-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close track info"
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Vinyl Record Visual */}
            <div className="relative w-28 h-28 md:w-32 md:h-32 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-neutral-900 border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
                {/* Grooves */}
                <div className="absolute inset-2 rounded-full border border-white/5" />
                <div className="absolute inset-4 rounded-full border border-white/10" />
                <div className="absolute inset-7 rounded-full border border-white/5" />
                
                {/* Center Label */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-white/20 flex items-center justify-center shadow-inner ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
                  <Disc className="w-6 h-6 text-white/80" />
                </div>
              </div>
            </div>

            {/* Subtle Label */}
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs tracking-widest uppercase mb-3 font-mono-code">
              <Music className="w-3.5 h-3.5" />
              <span>Now Playing</span>
            </div>

            {/* Song Title */}
            <h2 className="font-serif-display text-2xl md:text-3xl font-medium tracking-tight text-white mb-2 leading-tight">
              {track.title}
            </h2>

            {/* Artist Name */}
            <p className="font-mono-code text-sm md:text-base text-neutral-300 tracking-wider uppercase font-light">
              {track.artist}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
