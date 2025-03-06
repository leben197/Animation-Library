import { AnimationInterface, FrameOptions, SpriteSheetOptions } from "./types";

/**
 * CanvasAnimator - Canvas 渲染器实现
 * 使用Canvas API进行序列帧动画的渲染
 */
export class CanvasAnimator implements AnimationInterface {
  /** Canvas元素 */
  private canvas: HTMLCanvasElement;
  /** Canvas绘图上下文 */
  private ctx: CanvasRenderingContext2D;
  /** 当前帧索引 */
  private currentFrame = 0;
  /** 动画定时器ID */
  private animationRequestId?: number;
  /** 动画是否正在播放 */
  private isPlaying = false;
  /** 使用的图像数组 */
  private images: HTMLImageElement[];
  /** 是否使用精灵图 */
  private isSprite: boolean;
  /** 帧数 */
  private framesNum: number;
  /** 帧间距 */
  private spaceBetween: number;
  /** 是否是垂直排列的精灵图 */
  private isVertical: boolean = false;
  /** 精灵表配置 */
  private spriteSheet?: SpriteSheetOptions;
  /** 是否循环播放 */
  private loop: boolean;
  /** 回调函数 */
  private onPlay?: (instance: any) => void;
  private onPaused?: (instance: any) => void;
  private onStop?: (instance: any) => void;
  private onEnded?: (instance: any) => void;
  /** 上一帧时间 - 用于帧率控制 */
  private lastFrameTime = 0;
  /** 每帧间隔 - 毫秒 */
  private frameInterval: number;

  /**
   * 创建新的Canvas渲染器实例
   */
  constructor(private options: FrameOptions, images: HTMLImageElement[]) {
    // 初始化属性
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
    if (this.spriteSheet && images[0]) {
      if (this.spriteSheet.rows && this.spriteSheet.columns) {
        this.isVertical = this.spriteSheet.rows > 1 && this.spriteSheet.columns === 1;
      }
    } else if (this.isSprite && images[0]) {
      const img = images[0];
      if (img.height > img.width * 2) {
        this.isVertical = true;
      }
    }

    // 创建Canvas元素 - 使用原始尺寸，不考虑DPR
    this.canvas = document.createElement('canvas');
    this.canvas.width = options.width;
    this.canvas.height = options.height;
    this.canvas.style.width = `${options.width}px`;
    this.canvas.style.height = `${options.height}px`;

    // 获取绘图上下文
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('无法创建Canvas 2D上下文');
    }
    this.ctx = context;

    // 将Canvas添加到容器
    const container = typeof options.frameWrap === 'string'
      ? document.querySelector(options.frameWrap)
      : options.frameWrap;

    if (!container) {
      throw new Error('找不到动画容器');
    }

    container.appendChild(this.canvas);

    // 确保图像已完全加载
    const checkImagesLoaded = () => {
      const allLoaded = images.every(img => img.complete);
      if (allLoaded) {
        // 图像已加载完成，打印诊断信息并绘制第一帧
        if (images[0]) {
          console.log(`图像已加载: ${images[0].width}x${images[0].height}`);
        }
        this.draw();
      } else {
        // 继续等待
        setTimeout(checkImagesLoaded, 50);
      }
    };

    // 开始检查图像加载状态
    checkImagesLoaded();
  }

  /**
   * 绘制当前帧
   */
  private draw() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    try {
      if (this.spriteSheet && this.images[0]) {
        // 使用精灵表
        const { frameWidth, frameHeight, rows = 1, columns = 1 } = this.spriteSheet;
        const spriteImg = this.images[0];

        // 确定当前帧在精灵表中的位置
        let row, col;
        if (columns === 1 && rows > 1) {
          // 垂直排列
          row = this.currentFrame;
          col = 0;
        } else if (rows === 1 && columns > 1) {
          // 水平排列
          row = 0;
          col = this.currentFrame;
        } else {
          // 网格排列
          row = Math.floor(this.currentFrame / columns);
          col = this.currentFrame % columns;
        }

        // 计算源图像裁剪区域
        const sx = col * frameWidth;
        const sy = row * frameHeight;


        // 禁用图像平滑，保持像素清晰
        this.ctx.imageSmoothingEnabled = false;

        // 绘制当前帧到画布
        this.ctx.drawImage(
          spriteImg,
          sx, sy, frameWidth, frameHeight,  // 源区域：精确裁剪当前帧
          0, 0, this.canvas.width, this.canvas.height  // 目标区域：整个画布
        );

      } else if (this.isSprite && this.images[0]) {
        // 单一精灵图
        const spriteImg = this.images[0];
        let frameWidth, frameHeight, sx, sy;

        if (this.isVertical) {
          // 垂直排列
          frameWidth = spriteImg.width;
          frameHeight = spriteImg.height / this.framesNum;
          sx = 0;
          sy = this.currentFrame * (frameHeight + this.spaceBetween);
        } else {
          // 水平排列
          frameWidth = spriteImg.width / this.framesNum;
          frameHeight = spriteImg.height;
          sx = this.currentFrame * (frameWidth + this.spaceBetween);
          sy = 0;
        }

        // 绘制到画布
        this.ctx.drawImage(
          spriteImg,
          sx, sy, frameWidth, frameHeight,
          0, 0, this.canvas.width, this.canvas.height
        );

      } else if (this.images[this.currentFrame]) {
        // 多图序列
        const img = this.images[this.currentFrame];
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      }
    } catch (error) {
      console.error('绘制帧时出错:', error);
      console.error('当前帧索引:', this.currentFrame);
      console.error('总帧数:', this.getFrameCount());
      console.error('图像数量:', this.images.length);
    }
  }

  /**
   * 获取动画总帧数
   */
  private getFrameCount(): number {
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

    this.isPlaying = true;

    // 设置起始帧
    if (stopAtBeginning || idx !== undefined) {
      this.stop();
      if (idx !== undefined) {
        this.currentFrame = idx;
      }
    }

    // 重置帧计时
    this.lastFrameTime = 0;

    // 使用requestAnimationFrame实现平滑动画
    const animate = (timestamp: number) => {
      if (!this.isPlaying) return;

      // 首次调用或时间间隔达到目标帧间隔
      if (!this.lastFrameTime || timestamp - this.lastFrameTime >= this.frameInterval) {
        // 绘制当前帧
        this.draw();

    // 更新到下一帧
        this.currentFrame++;
        if (this.currentFrame >= this.getFrameCount()) {
          if (this.loop) {
            this.currentFrame = 0;
          } else {
            this.isPlaying = false;
            this.onEnded?.(this);
            return;
          }
        }

        this.lastFrameTime = timestamp;
      }

      // 继续动画循环
      this.animationRequestId = requestAnimationFrame(animate);
    };

    // 启动动画
    this.animationRequestId = requestAnimationFrame(animate);
    this.onPlay?.(this);
  }

  /**
   * 暂停动画播放
   */
  pause(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
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
    }

    this.currentFrame = 0;
    this.draw();
    this.onStop?.(this);
  }

  /**
   * 设置显示指定索引的帧
   * @param idx 帧索引
   */
  setFrameByIndex(idx: number): void {
    if (idx >= 0 && idx < this.getFrameCount()) {
      this.currentFrame = idx;
      this.draw();
    }
  }

  /**
   * 获取当前帧索引
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * 释放资源
   */
  destroy(): void {
    // 取消动画
    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
    }

    // 移除Canvas
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
