//渲染模式
export type RendererType = 'auto' | 'css' | 'canvas';
/**
 * 精灵表配置选项
 */
export interface SpriteSheetOptions {
  /** 精灵表图片路径 */
  src: string;
  /** 每帧宽度(像素) */
  frameWidth: number;
  /** 每帧高度(像素) */
  frameHeight: number;
  /** 总帧数 */
  frames: number;
}

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
  /** 精灵表配置，如果提供则优先使用精灵表而不是单独的图片 */
  spriteSheet?: SpriteSheetOptions;
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
