import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="infoModal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            id="modalBackdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel p-8 rounded-xl max-w-md w-full mx-4 relative z-10 text-center shadow-2xl border border-white/10"
            id="modalContent"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              id="closeModalBtn"
              aria-label="Close modal"
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <h2 className="font-serif-display text-3xl md:text-4xl text-white tracking-normal mb-6 mt-4">
              About
            </h2>

            {/* Description */}
            <p className="font-sans-body text-lg text-neutral-200 mb-8 leading-relaxed">
              A sanctuary for yearners worldwide.<br />
              Tune in, fade out.
            </p>

            {/* Author */}
            <p className="font-mono-code text-[11px] text-neutral-400 uppercase tracking-widest">
              ~by daksh maluskar
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
