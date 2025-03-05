import { AnimationInterface, FrameOptions } from "./types";

/**
 * CSS3Animator - CSS3 渲染器实现
 * 使用CSS3动画和背景图片实现序列帧动画
 */
export class CSS3Animator implements AnimationInterface {
  /** 动画容器元素 */
  private container: HTMLElement;
  /** 动画元素 */
  private animElement: HTMLDivElement;
  /** 动画样式元素 */
  private styleElement: HTMLStyleElement;
  /** 动画名称 */
  private animationName: string;
  /** 当前动画帧索引 */
  private currentFrame = 0;
  /** 动画持续时间(秒) */
  private duration: number;
  /** 是否启用循环播放 */
  private loop: boolean;
  /** 使用的图像数组 */
  private images: HTMLImageElement[];
  /** 是否使用精灵图 */
  private isSprite: boolean;
  /** 帧数 */
  private framesNum: number;
  /** 帧间距 */
  private spaceBetween: number;
  /** 精灵表配置 */
  private spriteSheet?: FrameOptions['spriteSheet'];
  /** 回调函数 */
  private onPlay?: (instance: any) => void;
  private onPaused?: (instance: any) => void;
  private onStop?: (instance: any) => void;
  private onEnded?: (instance: any) => void;
  /** 动画状态 */
  private isPlaying = false;

  /**
   * 创建一个新的CSS3渲染器实例
   * @param options 动画配置选项
   * @param images 已加载的图像元素数组
   */
  constructor(private options: FrameOptions, images: HTMLImageElement[]) {
    // 处理frameWrap，可能是字符串选择器或DOM元素
    if (typeof options.frameWrap === 'string') {
      const element = document.querySelector(options.frameWrap);
      if (!element) throw new Error(`找不到元素: ${options.frameWrap}`);
      this.container = element as HTMLElement;
    } else {
      this.container = options.frameWrap;
    }

    // 初始化属性
    this.images = images;
    this.animationName = `anim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.duration = this.images.length / (options.speed || 30);
    this.loop = options.loop !== false;
    this.isSprite = !!options.isSprite;
    this.framesNum = options.framesNum || 1;
    this.spaceBetween = options.spaceBetween || 0;
    this.spriteSheet = options.spriteSheet;

    // 存储回调函数
    this.onPlay = options.onPlay;
    this.onPaused = options.onPaused;
    this.onStop = options.onStop;
    this.onEnded = options.onEnded;

    // 创建DOM元素
    this.animElement = document.createElement('div');
    this.animElement.style.width = `${options.width}px`;
    this.animElement.style.height = `${options.height}px`;
    this.container.appendChild(this.animElement);

    // 创建样式元素
    this.styleElement = document.createElement('style');
    document.head.appendChild(this.styleElement);

    // 生成CSS动画
    this.generateAnimation();

    // 监听动画结束事件
    this.animElement.addEventListener('animationend', () => {
      if (!this.loop) {
        this.isPlaying = false;
        this.onEnded?.(this);
      }
    });
  }

  /**
   * 生成CSS动画规则
   */
  private generateAnimation() {
    let keyframes = '';

    if (this.isSprite && this.images[0]) {
      // 使用精灵图模式
      const spriteImg = this.images[0];
      const frameWidth = spriteImg.width / this.framesNum;

      // 生成关键帧
      for (let i = 0; i < this.framesNum; i++) {
        const percent = (i / (this.framesNum - 1)) * 100;
        const posX = -(i * (frameWidth + this.spaceBetween));
        keyframes += `
          ${percent}% {
            background-position: ${posX}px 0;
          }
        `;
      }

      // 设置背景图
      this.animElement.style.backgroundImage = `url(${spriteImg.src})`;
      this.animElement.style.backgroundSize = `${spriteImg.width}px ${spriteImg.height}px`;

    } else if (this.spriteSheet && this.images[0]) {
      // 使用spriteSheet配置
      const { frameWidth, frameHeight, frames } = this.spriteSheet;
      const spriteImg = this.images[0];
      const framesPerRow = Math.floor(spriteImg.width / frameWidth);

      // 生成关键帧
      for (let i = 0; i < frames; i++) {
        const percent = (i / (frames - 1)) * 100;
        const row = Math.floor(i / framesPerRow);
        const col = i % framesPerRow;
        const posX = -(col * frameWidth);
        const posY = -(row * frameHeight);

        keyframes += `
          ${percent}% {
            background-position: ${posX}px ${posY}px;
          }
        `;
      }

      // 设置背景图
      this.animElement.style.backgroundImage = `url(${spriteImg.src})`;
      this.animElement.style.backgroundSize = `${spriteImg.width}px ${spriteImg.height}px`;

    } else {
      // 使用多张图片模式 - 通过切换背景图实现
      this.images.forEach((img, i) => {
        const percent = (i / (this.images.length - 1)) * 100;
        keyframes += `
          ${percent}% {
            background-image: url(${img.src});
          }
        `;
      });

      // 设置初始背景图
      if (this.images[0]) {
        this.animElement.style.backgroundImage = `url(${this.images[0].src})`;
      }
    }

    // 设置动画CSS
    const css = `
      @keyframes ${this.animationName} {
        ${keyframes}
      }
    `;

    this.styleElement.textContent = css;
    this.animElement.style.backgroundRepeat = 'no-repeat';
    this.animElement.style.backgroundSize = 'contain';
  }

  /**
   * 开始播放动画
   * @param stopAtBeginning 是否从第一帧开始播放，默认为false
   * @param idx 指定开始播放的帧索引
   */
  play(stopAtBeginning?: boolean, idx?: number): void {
    if (!this.isPlaying) {
      this.isPlaying = true;

      // 设置起始帧
      if (stopAtBeginning || idx !== undefined) {
        this.stop();

        if (idx !== undefined) {
          // 使用idx参数来设置起始背景位置
          this.setFrameByIndex(idx);
        }
      }

      // 设置动画
      this.animElement.style.animation = `${this.animationName} ${this.duration}s ${this.loop ? 'infinite' : '1'} forwards`;

      // 调用回调
      this.onPlay?.(this);
    }
  }

  /**
   * 设置显示指定索引的帧
   * @param idx 帧索引
   */
  private setFrameByIndex(idx: number) {
    if (this.isSprite && this.images[0]) {
      // 精灵图模式
      const frameWidth = this.images[0].width / this.framesNum;
      const posX = -(idx * (frameWidth + this.spaceBetween));
      this.animElement.style.backgroundPosition = `${posX}px 0`;
    } else if (this.spriteSheet && this.images[0]) {
      // spriteSheet模式
      const { frameWidth, frameHeight } = this.spriteSheet;
      const framesPerRow = Math.floor(this.images[0].width / frameWidth);
      const row = Math.floor(idx / framesPerRow);
      const col = idx % framesPerRow;
      const posX = -(col * frameWidth);
      const posY = -(row * frameHeight);
      this.animElement.style.backgroundPosition = `${posX}px ${posY}px`;
    } else if (this.images[idx]) {
      // 多图模式
      this.animElement.style.backgroundImage = `url(${this.images[idx].src})`;
    }

    this.currentFrame = idx;
  }

  /**
   * 暂停动画播放
   */
  pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.animElement.style.animationPlayState = 'paused';
      this.onPaused?.(this);
    }
  }

  /**
   * 停止动画播放并重置到第一帧
   */
  stop(): void {
    this.isPlaying = false;
    this.animElement.style.animation = 'none';

    // 重置到第一帧
    if (this.isSprite || this.spriteSheet) {
      this.animElement.style.backgroundPosition = '0 0';
    } else if (this.images[0]) {
      this.animElement.style.backgroundImage = `url(${this.images[0].src})`;
    }

    this.currentFrame = 0;
    this.onStop?.(this);
  }
}
