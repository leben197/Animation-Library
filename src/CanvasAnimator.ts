import { AnimationInterface, FrameOptions, SpriteSheetOptions } from "./types";

/**
 * CanvasAnimator - Canvas 渲染器实现
 * 使用Canvas API进行序列帧动画的渲染
 */
export class CanvasAnimator implements AnimationInterface {
  /** Canvas元素 */
  private canvas: HTMLCanvasElement;
  /** Canvas 2D渲染上下文 */
  private ctx: CanvasRenderingContext2D;
  /** 当前动画帧索引 */
  private currentFrame = 0;
  /** 计时器ID */
  private timerId: number | null = null;
  /** 动画是否正在运行 */
  private isPlaying = false;
  /** 帧率间隔(毫秒) */
  private frameInterval: number;
  /** 是否启用循环播放 */
  private loop: boolean;
  /** 使用的图像数组 */
  private images: HTMLImageElement[];
  /** 是否使用精灵图模式 */
  private isSprite: boolean;
  /** 精灵图中的帧数 */
  private framesNum: number;
  /** 帧间距 */
  private spaceBetween: number;
  /** 精灵表配置 */
  private spriteSheet?: SpriteSheetOptions;
  /** 回调函数 */
  private onPlay?: (instance: any) => void;
  private onPaused?: (instance: any) => void;
  private onStop?: (instance: any) => void;
  private onEnded?: (instance: any) => void;

  /**
   * 创建一个新的Canvas渲染器实例
   * @param options 动画配置选项
   * @param images 已加载的图像元素数组
   */
  constructor(private options: FrameOptions, images: HTMLImageElement[]) {
    // 创建Canvas元素
    this.canvas = document.createElement('canvas');
    this.canvas.width = options.width;
    this.canvas.height = options.height;

    // 处理frameWrap，可能是字符串选择器或DOM元素
    let container: HTMLElement;
    if (typeof options.frameWrap === 'string') {
      const element = document.querySelector(options.frameWrap);
      if (!element) throw new Error(`找不到元素: ${options.frameWrap}`);
      container = element as HTMLElement;
    } else {
      container = options.frameWrap;
    }
    container.appendChild(this.canvas);

    // 获取渲染上下文
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas 2D上下文');
    this.ctx = ctx;

    // 初始化动画参数
    this.frameInterval = 1000 / (options.speed || 30);
    this.loop = options.loop !== false;
    this.images = images;
    this.isSprite = !!options.isSprite;
    this.framesNum = options.framesNum || 1;
    this.spaceBetween = options.spaceBetween || 0;
    this.spriteSheet = options.spriteSheet;

    // 存储回调函数
    this.onPlay = options.onPlay;
    this.onPaused = options.onPaused;
    this.onStop = options.onStop;
    this.onEnded = options.onEnded;
  }

  /**
   * 绘制当前帧
   */
  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.isSprite && this.images[0]) {
      // 使用isSprite模式 - 单张图包含多帧
      const spriteImg = this.images[0];
      const frameWidth = spriteImg.width / this.framesNum;
      const frameHeight = spriteImg.height;

      // 计算当前帧的x偏移
      const sourceX = this.currentFrame * (frameWidth + this.spaceBetween);

      this.ctx.drawImage(
        spriteImg,
        sourceX, 0, frameWidth, frameHeight,
        0, 0, this.canvas.width, this.canvas.height
      );
    } else if (this.spriteSheet && this.images[0]) {
      // 使用spriteSheet配置
      const { frameWidth, frameHeight, frames } = this.spriteSheet;
      const spriteImg = this.images[0];

      // 计算sprite sheet中的行列
      const framesPerRow = Math.floor(spriteImg.width / frameWidth);
      const row = Math.floor(this.currentFrame / framesPerRow);
      const col = this.currentFrame % framesPerRow;

      this.ctx.drawImage(
        spriteImg,
        col * frameWidth, row * frameHeight, frameWidth, frameHeight,
        0, 0, this.canvas.width, this.canvas.height
      );
    } else {
      // 使用多张图片模式
      const img = this.images[this.currentFrame];
      if (img) {
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  /**
   * 更新动画 - 显示下一帧并计划下一次更新
   */
  private update() {
    this.draw();

    // 确定最大帧数
    let maxFrames: number;
    if (this.isSprite) {
      maxFrames = this.framesNum;
    } else if (this.spriteSheet) {
      maxFrames = this.spriteSheet.frames;
    } else {
      maxFrames = this.images.length;
    }

    this.currentFrame++;
    if (this.currentFrame >= maxFrames) {
      if (this.loop) {
        this.currentFrame = 0;
      } else {
        this.currentFrame = maxFrames - 1;
        this.pause();
        this.onEnded?.(this);
        return;
      }
    }

    if (this.isPlaying) {
      this.timerId = window.setTimeout(() => this.update(), this.frameInterval);
    }
  }

  /**
   * 开始播放动画
   * @param stopAtBeginning 是否从第一帧开始播放，默认为false
   * @param idx 指定开始播放的帧索引
   */
  play(stopAtBeginning?: boolean, idx?: number): void {
    if (stopAtBeginning) {
      this.currentFrame = 0;
    }

    if (typeof idx === 'number' && idx >= 0) {
      // 如果指定了起始帧，则从指定帧开始
      const maxFrames = this.isSprite
        ? this.framesNum
        : (this.spriteSheet?.frames || this.images.length);

      this.currentFrame = Math.min(idx, maxFrames - 1);
    }

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.onPlay?.(this);
      this.update();
    }
  }

  /**
   * 暂停动画播放
   */
  pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.timerId !== null) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      this.onPaused?.(this);
    }
  }

  /**
   * 停止动画播放并重置到第一帧
   */
  stop(): void {
    this.pause();
    this.currentFrame = 0;
    this.draw();
    this.onStop?.(this);
  }
}
