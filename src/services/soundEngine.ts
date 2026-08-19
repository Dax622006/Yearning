import { Track } from '../types';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  
  // YouTube player
  private ytPlayer: any = null;
  private isYtReady = false;
  private ytContainerId = 'yt-hidden-player';
  private ytPollInterval: number | null = null;
  private currentYouTubeId: string | null = null;
  private isYouTubePlaying = false;

  // Ambient generators
  private vinylNode: AudioNode | null = null;
  private vinylGain: GainNode | null = null;
  private rainNode: AudioNode | null = null;
  private rainGain: GainNode | null = null;

  // Synth sequencer fallback
  private isSynthPlaying = false;
  private synthInterval: number | null = null;
  private currentChordIndex = 0;
  private volume = 0.85;

  private isAudioElementPlaying = false;

  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  private onTrackEndedCallback?: () => void;
  private synthCurrentTime = 0;
  private synthTimer: number | null = null;

  constructor() {
    this.initYouTubeAPI();
  }

  private initYouTubeAPI() {
    if (typeof window === 'undefined') return;

    if (window.YT && window.YT.Player) {
      this.isYtReady = true;
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      this.isYtReady = true;
      this.createYTPlayer();
    };
  }

  private createYTPlayer(initialVideoId?: string) {
    if (!window.YT || !window.YT.Player) return;

    let el = document.getElementById(this.ytContainerId);
    if (!el) {
      el = document.createElement('div');
      el.id = this.ytContainerId;
      el.style.position = 'fixed';
      el.style.bottom = '-9999px';
      el.style.left = '-9999px';
      el.style.width = '200px';
      el.style.height = '200px';
      el.style.opacity = '0.01';
      el.style.pointerEvents = 'none';
      document.body.appendChild(el);
    }

    try {
      this.ytPlayer = new window.YT.Player(this.ytContainerId, {
        height: '200',
        width: '200',
        videoId: initialVideoId || 'SkKxWOVYyJk',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            this.ytPlayer = event.target;
            this.ytPlayer.setVolume(this.volume * 100);
            if (this.currentYouTubeId && this.isYouTubePlaying) {
              this.ytPlayer.loadVideoById(this.currentYouTubeId);
              this.ytPlayer.playVideo();
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              this.isYouTubePlaying = true;
              this.startYtPolling();
              try {
                const dur = this.ytPlayer?.getDuration?.();
                if (dur && dur > 0 && this.onTimeUpdateCallback) {
                  this.onTimeUpdateCallback(this.ytPlayer?.getCurrentTime?.() || 0, dur);
                }
              } catch (e) {}
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              this.isYouTubePlaying = false;
              this.stopYtPolling();
            } else if (event.data === window.YT.PlayerState.ENDED) {
              this.isYouTubePlaying = false;
              this.stopYtPolling();
              if (this.onTrackEndedCallback) {
                this.onTrackEndedCallback();
              }
            }
          },
          onError: (err: any) => {
            console.warn('YouTube playback restricted or failed, playing ambient synthesizer:', err);
            this.isYouTubePlaying = false;
            this.stopYtPolling();
            this.startSynthPlayback({ id: 'fallback', title: 'Yearning Sanctuary', artist: 'Atmospheric Synth', duration: 240, sourceType: 'synth' }, 0);
          }
        },
      });
    } catch (e) {
      console.warn('Could not initialize YT player', e);
    }
  }

  private startYtPolling() {
    this.stopYtPolling();
    this.ytPollInterval = window.setInterval(() => {
      if (this.ytPlayer && this.ytPlayer.getCurrentTime && this.ytPlayer.getDuration) {
        try {
          const cur = this.ytPlayer.getCurrentTime() || 0;
          const dur = this.ytPlayer.getDuration() || 0;
          if (this.onTimeUpdateCallback) {
            this.onTimeUpdateCallback(cur, dur);
          }
        } catch (e) {}
      }
    }, 500);
  }

  private stopYtPolling() {
    if (this.ytPollInterval !== null) {
      clearInterval(this.ytPollInterval);
      this.ytPollInterval = null;
    }
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setCallbacks(
    onTimeUpdate: (currentTime: number, duration: number) => void,
    onEnded: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onTrackEndedCallback = onEnded;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.ytPlayer && this.ytPlayer.setVolume) {
      try {
        this.ytPlayer.setVolume(this.volume * 100);
      } catch (e) {}
    }
  }

  public async playTrack(track: Track, startTime = 0): Promise<boolean> {
    this.initContext();
    this.stopCurrent();

    if (track.sourceType === 'youtube' && track.youtubeId) {
      this.currentYouTubeId = track.youtubeId;
      this.isYouTubePlaying = true;

      if (!this.ytPlayer) {
        this.createYTPlayer(track.youtubeId);
      } else if (this.ytPlayer.loadVideoById) {
        try {
          this.ytPlayer.loadVideoById({
            videoId: track.youtubeId,
            startSeconds: startTime,
          });
          this.ytPlayer.setVolume(this.volume * 100);
          this.ytPlayer.playVideo();
        } catch (e) {
          console.warn('YT loadVideoById error, fallback to synth', e);
          this.startSynthPlayback(track, startTime);
        }
      }
      return true;
    }

    if (track.audioUrl) {
      try {
        if (!this.audioElement) {
          this.audioElement = new Audio();
          this.audioElement.crossOrigin = 'anonymous';
          this.audioElement.addEventListener('timeupdate', () => {
            if (this.audioElement && this.onTimeUpdateCallback) {
              this.onTimeUpdateCallback(this.audioElement.currentTime, this.audioElement.duration || track.duration);
            }
          });
          this.audioElement.addEventListener('ended', () => {
            this.isAudioElementPlaying = false;
            if (this.onTrackEndedCallback) {
              this.onTrackEndedCallback();
            }
          });
          this.audioElement.addEventListener('error', () => {
            console.warn('Audio stream fallback to synth');
            this.isAudioElementPlaying = false;
            this.startSynthPlayback(track, startTime);
          });
        }

        this.audioElement.src = track.audioUrl;
        this.audioElement.currentTime = startTime;
        this.audioElement.volume = this.volume;
        await this.audioElement.play();
        this.isAudioElementPlaying = true;
        return true;
      } catch (err) {
        this.isAudioElementPlaying = false;
        this.startSynthPlayback(track, startTime);
        return true;
      }
    } else {
      this.startSynthPlayback(track, startTime);
      return true;
    }
  }

  public pause() {
    if (this.ytPlayer && this.isYouTubePlaying) {
      try {
        this.ytPlayer.pauseVideo();
      } catch (e) {}
      this.isYouTubePlaying = false;
      this.stopYtPolling();
    }
    if (this.audioElement && this.isAudioElementPlaying) {
      this.audioElement.pause();
      this.isAudioElementPlaying = false;
    }
    if (this.isSynthPlaying) {
      this.stopSynth();
    }
  }

  public resume(track: Track, currentTime: number) {
    if (track.sourceType === 'youtube' && track.youtubeId) {
      if (this.ytPlayer && this.ytPlayer.playVideo) {
        try {
          this.ytPlayer.playVideo();
          this.isYouTubePlaying = true;
          this.startYtPolling();
        } catch (e) {
          this.playTrack(track, currentTime);
        }
      } else {
        this.playTrack(track, currentTime);
      }
    } else if (track.audioUrl && this.audioElement && this.audioElement.src) {
      this.audioElement.currentTime = currentTime;
      this.audioElement.play().then(() => {
        this.isAudioElementPlaying = true;
      }).catch(() => {
        this.startSynthPlayback(track, currentTime);
      });
    } else {
      this.startSynthPlayback(track, currentTime);
    }
  }

  public seek(track: Track, targetTime: number) {
    if (track.sourceType === 'youtube' && this.ytPlayer && this.ytPlayer.seekTo) {
      try {
        this.ytPlayer.seekTo(targetTime, true);
      } catch (e) {}
    } else if (this.audioElement && this.isAudioElementPlaying) {
      this.audioElement.currentTime = targetTime;
    }
    this.synthCurrentTime = targetTime;
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(targetTime, track.duration);
    }
  }

  public stopCurrent() {
    if (this.ytPlayer && this.isYouTubePlaying) {
      try {
        this.ytPlayer.stopVideo();
      } catch (e) {}
      this.isYouTubePlaying = false;
      this.stopYtPolling();
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.isAudioElementPlaying = false;
    }
    this.stopSynth();
  }

  // --- PROCEDURAL AMBIENT SYNTHESIZER ---
  private startSynthPlayback(track: Track, initialTime = 0) {
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    this.isSynthPlaying = true;
    this.synthCurrentTime = initialTime;

    const progressions = [
      [146.83, 220.00, 261.63, 329.63, 440.00], // Dm9
      [116.54, 174.61, 233.08, 293.66, 349.23], // Bbmaj7
      [98.00, 146.83, 196.00, 261.63, 293.66],  // Gm7/9
      [110.00, 164.81, 220.00, 277.18, 329.63], // A7(b13)
      [130.81, 164.81, 196.00, 246.94, 329.63], // Cmaj9
      [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj7
    ];

    const playChordStep = () => {
      if (!this.isSynthPlaying || !this.audioCtx || !this.masterGain) return;

      const chord = progressions[this.currentChordIndex % progressions.length];
      this.currentChordIndex++;

      const now = this.audioCtx.currentTime;
      const chordDuration = 5.5;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 1.2);
      filter.frequency.exponentialRampToValueAtTime(450, now + chordDuration);

      const chordGain = this.audioCtx.createGain();
      chordGain.gain.setValueAtTime(0, now);
      chordGain.gain.linearRampToValueAtTime(0.28, now + 1.5);
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + chordDuration);

      filter.connect(chordGain);
      chordGain.connect(this.masterGain);

      chord.forEach((freq, i) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);

        noteGain.gain.setValueAtTime(0, now + i * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.3);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + chordDuration);

        osc.connect(noteGain);
        noteGain.connect(filter);

        osc.start(now + i * 0.12);
        osc.stop(now + chordDuration + 0.5);
      });
    };

    playChordStep();
    this.synthInterval = window.setInterval(playChordStep, 5000);

    this.synthTimer = window.setInterval(() => {
      if (!this.isSynthPlaying) return;
      this.synthCurrentTime += 1;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.synthCurrentTime, track.duration);
      }
      if (this.synthCurrentTime >= track.duration) {
        if (this.onTrackEndedCallback) {
          this.onTrackEndedCallback();
        }
      }
    }, 1000);
  }

  private stopSynth() {
    this.isSynthPlaying = false;
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.synthTimer !== null) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  // --- AMBIENT SOUND LAYERS ---
  public setVinyl(enabled: boolean, volume = 0.25) {
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    if (!enabled) {
      if (this.vinylGain) {
        this.vinylGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      }
      return;
    }

    if (!this.vinylNode) {
      const bufferSize = this.audioCtx.sampleRate * 2;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        if (Math.random() < 0.001) {
          output[i] += (Math.random() * 2 - 1) * 0.4;
        }
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 1.2;

      this.vinylGain = this.audioCtx.createGain();
      this.vinylGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.vinylGain);
      this.vinylGain.connect(this.masterGain);

      whiteNoise.start(0);
      this.vinylNode = whiteNoise;
    } else if (this.vinylGain) {
      this.vinylGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    }
  }

  public setRain(enabled: boolean, volume = 0.3) {
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    if (!enabled) {
      if (this.rainGain) {
        this.rainGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      }
      return;
    }

    if (!this.rainNode) {
      const bufferSize = this.audioCtx.sampleRate * 3;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const lowpass = this.audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 800;

      const highpass = this.audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 120;

      this.rainGain = this.audioCtx.createGain();
      this.rainGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);

      noise.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);

      noise.start(0);
      this.rainNode = noise;
    } else if (this.rainGain) {
      this.rainGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    }
  }
}

export const soundEngine = new SoundEngine();
