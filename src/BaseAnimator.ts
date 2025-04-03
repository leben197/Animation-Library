import { AnimationInterface, FrameOptions, SpriteSheetOptions } from "./types";

/**
 * 基础动画渲染器 - 抽象类
 * 包含CSS3Animator和CanvasAnimator的共享逻辑
 */
export abstract class BaseAnimator implements AnimationInterface {
  /** 当前帧索引 */
  protected currentFrame = 0;
  /** 动画定时器ID */
  protected animationRequestId?: number;
  /** 动画是否正在播放 */
  protected isPlaying = false;
  /** 使用的图像数组 */
  protected images: HTMLImageElement[];
  /** 是否使用精灵图 */
  protected isSprite: boolean;
  /** 帧数 */
  protected framesNum: number;
  /** 帧间距 */
  protected spaceBetween: number;
  /** 是否是垂直排列的精灵图 */
  protected isVertical: boolean = false;
  /** 精灵表配置 */
  protected spriteSheet?: SpriteSheetOptions;
  /** 是否循环播放 */
  protected loop: boolean;
  /** 回调函数 */
  protected onPlay?: (instance: any) => void;
  protected onPaused?: (instance: any) => void;
  protected onStop?: (instance: any) => void;
  protected onEnded?: (instance: any) => void;
  /** 上一帧时间 - 用于帧率控制 */
  protected lastFrameTime = 0;
  /** 每帧间隔 - 毫秒 */
  protected frameInterval: number;

  /**
   * 基础构造函数
   */
  constructor(protected options: FrameOptions, images: HTMLImageElement[]) {
    // 初始化共享属性
    this.images = images;
    this.isSprite = !!options.isSprite;
    this.framesNum = options.framesNum || 1;
    this.spaceBetween = options.spaceBetween || 0;
    this.spriteSheet = options.spriteSheet;
    this.loop = options.loop !== false;
    this.frameInterval = 1000 / (options.speed || 30);

    // 存储回调函数
    this.onPlay = options.onPlay;
    this.onPaused = options.onPaused;
    this.onStop = options.onStop;
    this.onEnded = options.onEnded;

    // 检测是否为垂直精灵图
    this.detectVerticalSprite();
  }

  /**
   * 检测是否为垂直排列的精灵图
   */
  protected detectVerticalSprite(): void {
    if (this.spriteSheet && this.images[0]) {
      if (this.spriteSheet.rows && this.spriteSheet.columns) {
        this.isVertical = this.spriteSheet.rows > 1 && this.spriteSheet.columns === 1;
      }
    } else if (this.isSprite && this.images[0]) {
      const img = this.images[0];
      if (img.height > img.width * 2) {
        this.isVertical = true;
      }
    }
  }

  /**
   * 获取动画总帧数
   */
  protected getFrameCount(): number {
    if (this.isSprite) {
      return this.framesNum;
    } else if (this.spriteSheet) {
      return this.spriteSheet.frames;
    } else {
      return this.images.length;
    }
  }

  /**
   * 播放动画
   */
  play(stopAtBeginning?: boolean, idx?: number): void {
    if (this.isPlaying) return;

    // 设置起始帧
    if (stopAtBeginning || idx !== undefined) {
      this.stop();
      if (idx !== undefined) {
        this.currentFrame = idx;
      }
    }

    this.isPlaying = true;
    this.lastFrameTime = 0; // 重置帧计时

    // 启动动画循环
    this.startAnimationLoop();

    this.onPlay?.(this);
  }

  /**
   * 启动动画循环 - 子类必须实现
   */
  protected abstract startAnimationLoop(): void;

  /**
   * 绘制当前帧 - 子类必须实现
   */
  protected abstract renderFrame(): void;

  /**
   * 暂停动画播放
   */
  pause(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
      this.animationRequestId = undefined;
    }

    this.onPaused?.(this);
  }

  /**
   * 停止动画播放并重置到第一帧
   */
  stop(): void {
    this.isPlaying = false;

    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
      this.animationRequestId = undefined;
    }

    this.currentFrame = 0;
    this.renderFrame(); // 调用子类实现的渲染方法
    this.onStop?.(this);
  }

  /**
   * 设置显示指定索引的帧
   * @param idx 帧索引
   */
  setFrameByIndex(idx: number): void {
    if (idx >= 0 && idx < this.getFrameCount()) {
      this.currentFrame = idx;
      // 从基类方法中移除自动渲染调用
      // 让子类在需要时自行决定是否需要渲染
    }
  }

  /**
   * 通用动画循环方法 - 供子类调用
   */
  protected animateWithRequestAnimationFrame(): void {
    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
    }

    const frameCount = this.getFrameCount();
    let lastFrameIndex = this.currentFrame;

    const animate = (timestamp: number) => {
      if (!this.isPlaying) return;

      // 首次调用初始化时间
      if (!this.lastFrameTime) {
        this.lastFrameTime = timestamp;
        this.animationRequestId = requestAnimationFrame(animate);
        return;
      }

      const elapsed = timestamp - this.lastFrameTime;

      // 只有经过足够时间才更新下一帧
      if (elapsed >= this.frameInterval) {
        // 记住当前帧，方便调试
        lastFrameIndex = this.currentFrame;

        // 每次只更新到下一帧
        this.currentFrame = (this.currentFrame + 1) % frameCount;

        // 检查是否需要结束动画
        if (this.currentFrame === 0 && !this.loop) {
          this.isPlaying = false;
          this.currentFrame = frameCount - 1;
          this.renderFrame();
          this.onEnded?.(this);
          return;
        }

        // 渲染当前帧
        this.renderFrame();

        // 更新时间戳
        this.lastFrameTime = timestamp;
      }

      this.animationRequestId = requestAnimationFrame(animate);
    };

    this.animationRequestId = requestAnimationFrame(animate);
  }
}
