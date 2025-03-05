//渲染模式
export type RendererType = 'auto' | 'css' | 'canvas';
//帧动画配置选项
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
  renderer?: RendererType;
}
//动画接口
export interface AnimationInterface {
  play: (stopAtBeginning?: boolean, idx?: number) => void;
  pause: () => void;
  stop: () => void;
}
