export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  audioUrl?: string;
  youtubeId?: string;
  mood?: string;
  sourceType: 'youtube' | 'stream' | 'synth';
  synthStyle?: 'lofi-piano' | 'ambient-pad' | 'nocturne' | 'rainy-diner' | 'tape-echoes';
  coverArt?: string;
}

export interface BackgroundScene {
  id: string;
  title: string;
  film?: string;
  year?: string;
  imageUrl: string;
  overlayOpacity: number;
}

export interface AmbientLayer {
  id: string;
  name: string;
  type: 'vinyl' | 'rain' | 'wind' | 'tape' | 'drone';
  volume: number;
  active: boolean;
}
