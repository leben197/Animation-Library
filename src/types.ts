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
  /** 精灵表的行数 */
  rows: number;
  /** 精灵表的列数 */
  columns: number;
}
/**
 * 动画基础配置
 * 所有配置方式共用的基础属性
 */
interface BaseFrameOptions {
  /** 图片路径数组 */
  imgs: string[];
  /** 动画容器元素或选择器 */
  frameWrap: HTMLElement | string;
  /** 动画宽度 */
  width: number;
  /** 动画高度 */
  height: number;
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 帧间延迟(毫秒)或帧率 */
  speed?: number;
  /** 是否循环播放 */
  loop?: boolean;
  /** 渲染模式 */
  renderer?: RendererType;
  /** 动画准备就绪回调 */
  onReady?: () => void;
  /** 开始播放回调 */
  onPlay?: (instance: any) => void;
  /** 暂停回调 */
  onPaused?: (instance: any) => void;
  /** 停止回调 */
  onStop?: (instance: any) => void;
  /** 播放结束回调（非循环模式） */
  onEnded?: (instance: any) => void;
}

/**
 * 普通帧序列动画配置
 * 使用多个独立图片
 */
interface NormalFrameOptions extends BaseFrameOptions {
  isSprite?: false;
  framesNum?: never;
  spaceBetween?: never;
  spriteSheet?: never;
}

/**
 * 精灵图动画配置
 * 使用单张长图包含多个帧
 */
interface SpriteFrameOptions extends BaseFrameOptions {
  isSprite: true;
  /** 精灵图中的帧数（当isSprite为true时必填） */
  framesNum: number;
  /** 帧之间的间隔像素 */
  spaceBetween?: number;
  spriteSheet?: never;
}


/**
 * 精灵表动画配置
 * 使用SpriteSheet对象定义的精灵图
 */
interface SpriteSheetFrameOptions extends BaseFrameOptions {
  isSprite?: boolean;
  framesNum?: never;
  spaceBetween?: never;
  /** 精灵表配置，提供更细粒度的精灵图控制 */
  spriteSheet: SpriteSheetOptions;
}

/**
 * 帧动画配置选项
 * 三种不同的配置方式:
 * 1. 普通图片序列模式
 * 2. 精灵图模式(isSprite: true，需指定framesNum)
 * 3. 精灵表模式(提供spriteSheet对象)
 */
export type FrameOptions = NormalFrameOptions | SpriteFrameOptions | SpriteSheetFrameOptions;


/**
 * 为了保持向后兼容，同时提供接口版本
 * @deprecated 推荐使用FrameOptions类型，提供更精确的类型检查
 */
export interface IFrameOptions {
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
