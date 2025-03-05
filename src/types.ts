export interface FrameOptions {
  imgs: string[];
  frameWrap: HTMLElement | string;
  width: number;
  height: number;
  isSprite?: boolean;
  autoPlay?: boolean;
  spaceBetween?: number;
  speed?: number;
  framesNum?: number;
  loop?: boolean;
  onReady?: () => void;
  onPlay?: (instance: any) => void;
  onPaused?: (instance: any) => void;
  onStop?: (instance: any) => void;
  onEnded?: (instance: any) => void;
}

export interface AnimationInterface {
  play: (stopAtBeginning?: boolean, idx?: number) => void;
  pause: () => void;
  stop: () => void;
}
