import { BaseAnimator } from "./BaseAnimator";
import { FrameOptions } from "./types";

/**
 * Canvas 渲染器实现
 */
export class CanvasAnimator extends BaseAnimator {
  /** Canvas元素 */
  private canvas: HTMLCanvasElement;
  /** Canvas绘图上下文 */
  private ctx: CanvasRenderingContext2D;
  /** 离屏Canvas及优化相关属性 */
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private workerSupported = typeof Worker !== 'undefined';
  private renderWorker: Worker | null = null;
  private frameCache: Map<number, ImageData> = new Map();
  private useOffscreen: boolean = false;
  private useFrameCache: boolean = false;
  private maxCacheFrames: number = 50;
  private frameDuration: number = 0;
  private useWorker: boolean = false;
  private workerPath: string = '';

  constructor(options: FrameOptions, images: HTMLImageElement[]) {
    super(options, images);

    // 创建Canvas元素
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

    // 确保图像已完全加载并绘制第一帧
    const checkImagesLoaded = () => {
      const allLoaded = images.every(img => img.complete);
      if (allLoaded) {
        this.draw();
      } else {
        setTimeout(checkImagesLoaded, 50);
      }
    };
    checkImagesLoaded();

    // 配置性能优化选项
    this.useOffscreen = options.performance?.useOffscreen !== false;
    this.useFrameCache = options.performance?.useFrameCache !== false;
    this.maxCacheFrames = options.performance?.maxCacheFrames || 50;
    this.frameDuration = this.frameInterval;

    // 配置Worker选项
    this.useWorker = !!options.workerOptions?.enabled;
    this.workerPath = options.workerOptions?.workerPath || './render-worker.js';

    // 设置优化
    if (this.useOffscreen) {
      this.setupOffscreenCanvas();
    }
    if (this.useWorker && this.workerSupported) {
      this.setupRenderWorker();
    }
  }

  // 实现抽象方法
  protected startAnimationLoop(): void {
    if (this.useOffscreen || this.useFrameCache || this.useWorker) {
      this.playWithOptimization();
    } else {
      this.animateWithRequestAnimationFrame();
    }
  }

  // 实现抽象方法
  protected renderFrame(): void {
    this.draw();
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
   * 使用优化技术播放动画
   */
  private playWithOptimization(): void {
    this.lastFrameTime = 0;
    this.cancelAnimation();

    // 获取总帧数 - 这是一个关键修复，之前引用了函数对象而非调用函数
    const frameCount = this.getFrameCount();

    // 记录上次更新的帧索引，初始化为当前帧
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
        // 记住当前帧，用于跳帧检测
        lastFrameIndex = this.currentFrame;

        // 每次只更新到下一帧
        this.currentFrame = (this.currentFrame + 1) % frameCount;

        // 检查是否需要结束动画
        if (this.currentFrame === 0 && !this.loop) {
          this.isPlaying = false;
          this.currentFrame = frameCount - 1;
          this.renderOptimizedFrame();
          this.onEnded?.(this);
          return;
        }

        // 渲染当前帧
        this.renderOptimizedFrame();

        // 更新时间戳 - 只有在实际渲染了新帧后才更新
        this.lastFrameTime = timestamp;

        // 移除跳帧检测，因为逻辑上不会跳帧了
      }

      this.animationRequestId = requestAnimationFrame(animate);
    };

    this.animationRequestId = requestAnimationFrame(animate);
    this.onPlay?.(this);  // 添加播放回调
  }

  /**
   * 渲染优化后的帧
   */
  private renderOptimizedFrame(): void {
    // 如果启用了缓存，先检查缓存
    if (this.useFrameCache && this.frameCache.has(this.currentFrame)) {
      const cachedImageData = this.frameCache.get(this.currentFrame);
      if (cachedImageData) {
        this.ctx.putImageData(cachedImageData, 0, 0);
        return;
      }
    }

    // 根据启用的优化选项选择渲染路径
    if (this.useWorker && this.renderWorker) {
      // Worker路径: 尝试使用Worker处理
      if (this.spriteSheet && this.images[0]) {
        this.drawSpriteSheetFrame(this.currentFrame);
      } else if (this.isSprite && this.images[0]) {
        this.drawSpriteFrame(this.currentFrame);
      } else if (this.images[this.currentFrame]) {
        this.drawSequenceFrame(this.currentFrame);
      } else {
        // 如果没有可用的图像数据，回退到标准绘制
        this.draw();
      }
    } else if (this.useOffscreen) {
      // 离屏绘制路径: 使用离屏Canvas
      this.renderFrameToOffscreen();
      if (this.ctx && this.offscreenCanvas) {
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
      }
    } else {
      // 标准路径: 直接绘制到主Canvas
      this.draw();
    }

    // 缓存当前帧(除非使用Worker，Worker有自己的缓存逻辑)
    if (this.useFrameCache && !this.useWorker) {
      this.cacheCurrentFrame();
    }
  }

  /**
   * 绘制精灵表帧 - 支持Worker处理
   */
  private drawSpriteSheetFrame(frameIndex: number): void {
    if (!this.renderWorker || !this.images[0] || !this.spriteSheet) {
      // Worker不可用，回退到主线程绘制
      this.draw();
      return;
    }

    try {
      // 创建临时画布来传输图像数据
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
        // 如果无法获取上下文，回退到标准绘制
        this.draw();
        return;
      }

      // 绘制精灵表到临时画布
      tempCtx.drawImage(this.images[0], 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      // 将帧数据发送给Worker处理
      this.renderWorker.postMessage({
        type: 'render_sprite_sheet',
        frameIndex: frameIndex,
        imageData: imageData.data.buffer,
        imageWidth: this.images[0].width,
        imageHeight: this.images[0].height,
        spriteSheet: this.spriteSheet,
        width: this.canvas.width,
        height: this.canvas.height
      }, [imageData.data.buffer]); // 使用Transferable对象提高性能

      // 同时在主线程上也渲染一次，确保用户看到内容
      // 这帧可能不是最终效果，但Worker处理完成后会更新
      this.draw();

    } catch (error) {
      console.warn('Worker处理失败，回退到主线程:', error);
      this.draw();
    }
  }

  /**
   * 绘制精灵图帧 - 支持Worker处理
   */
  private drawSpriteFrame(frameIndex: number): void {
    if (!this.renderWorker || !this.images[0]) {
      // Worker不可用，回退到主线程绘制
      this.draw();
      return;
    }

    try {
      // 创建临时画布来传输图像数据
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
        this.draw();
        return;
      }

      // 绘制精灵图到临时画布
      tempCtx.drawImage(this.images[0], 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      // 将帧数据发送给Worker处理
      this.renderWorker.postMessage({
        type: 'render_sprite',
        frameIndex: frameIndex,
        imageData: imageData.data.buffer,
        imageWidth: this.images[0].width,
        imageHeight: this.images[0].height,
        isVertical: this.isVertical,
        framesNum: this.framesNum,
        spaceBetween: this.spaceBetween,
        width: this.canvas.width,
        height: this.canvas.height
      }, [imageData.data.buffer]);

      // 同时在主线程上也渲染一次
      this.draw();

    } catch (error) {
      console.warn('Worker处理失败，回退到主线程:', error);
      this.draw();
    }
  }

  /**
   * 绘制序列帧 - 支持Worker处理
   */
  private drawSequenceFrame(frameIndex: number): void {
    if (!this.renderWorker || !this.images[frameIndex]) {
      // Worker不可用，回退到主线程绘制
      this.draw();
      return;
    }

    try {
      // 创建临时画布来传输当前帧图像数据
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (!tempCtx) {
        this.draw();
        return;
      }

      // 绘制当前帧到临时画布
      tempCtx.drawImage(this.images[frameIndex], 0, 0, tempCanvas.width, tempCanvas.height);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

      // 将帧数据发送给Worker处理
      this.renderWorker.postMessage({
        type: 'render_sequence',
        frameIndex: frameIndex,
        imageData: imageData.data.buffer,
        width: this.canvas.width,
        height: this.canvas.height
      }, [imageData.data.buffer]);

      // 同时在主线程上也渲染一次
      this.draw();

    } catch (error) {
      console.warn('Worker处理失败，回退到主线程:', error);
      this.draw();
    }
  }

  /**
   * 设置离屏Canvas进行离屏渲染
   */
  private setupOffscreenCanvas(): void {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.options.width;
    this.offscreenCanvas.height = this.options.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  }

  /**
   * 设置Web Worker进行渲染计算
   */
  private setupRenderWorker(): void {
    if (!this.workerSupported) return;

    try {
      // 创建增强版内联Worker
      const workerCode = `
        // Worker内部代码 - 专门用于处理图像计算
        const ctx = self;
        let canvasWidth = 0;
        let canvasHeight = 0;

        // 图像处理功能
        const imageProcessors = {
          // 应用滤镜效果 - 可以根据需要扩展更多高计算量效果
          applyEffects: function(data, options = {}) {
            // 默认不应用任何效果，返回原图像
            return data;
          }
        };

        self.onmessage = function(e) {
          const data = e.data;

          switch(data.type) {
            case 'init':
              canvasWidth = data.width || 0;
              canvasHeight = data.height || 0;
              break;

            case 'render_sprite_sheet':
              // 处理精灵表帧渲染
              // 在真实实现中，这里可以有复杂的图像处理算法
              ctx.postMessage({
                type: 'render_complete',
                frameIndex: data.frameIndex,
                imageData: data.imageData
              }, [data.imageData]);
              break;

            case 'render_sprite':
              // 处理精灵图帧渲染
              ctx.postMessage({
                type: 'render_complete',
                frameIndex: data.frameIndex,
                imageData: data.imageData
              }, [data.imageData]);
              break;

            case 'render_sequence':
              // 处理序列帧渲染
              ctx.postMessage({
                type: 'render_complete',
                frameIndex: data.frameIndex,
                imageData: data.imageData
              }, [data.imageData]);
              break;
          }
        };
      `;

      // 创建Blob URL并初始化Worker
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.renderWorker = new Worker(URL.createObjectURL(blob));

      // 设置Worker消息处理
      this.renderWorker.onmessage = (e) => {
        if (e.data.type === 'render_complete') {
          // 处理Worker返回的渲染结果
          const imageData = e.data.imageData;
          const frameIndex = e.data.frameIndex;

          // 只应用结果，如果它与当前帧匹配
          if (frameIndex === this.currentFrame && imageData) {
            this.applyWorkerImageData(imageData);
          }
        }
      };

      // 初始化Worker
      this.renderWorker.postMessage({
        type: 'init',
        width: this.canvas.width,
        height: this.canvas.height
      });
    } catch (err) {
      console.warn('Web Worker初始化失败:', err);
      this.useWorker = false;
    }
  }

  /**
   * 将Worker处理的图像数据应用到画布
   */
  private applyWorkerImageData(imageBuffer: ArrayBuffer): void {
    if (!this.ctx) return;

    try {
      // 从ArrayBuffer创建ImageData
      const imageData = new ImageData(
        new Uint8ClampedArray(imageBuffer),
        this.canvas.width,
        this.canvas.height
      );

      // 将处理后的图像数据绘制到主Canvas
      this.ctx.putImageData(imageData, 0, 0);

      // 缓存处理后的帧
      if (this.useFrameCache) {
        this.frameCache.set(this.currentFrame, imageData);
        this.cleanupCache();
      }
    } catch (e) {
      console.error('应用Worker图像数据失败:', e);
  // 如果应用Worker数据失败，回退到标准绘制
      this.draw();
    }
  }

  /**
   * 将当前帧渲染到离屏Canvas并缓存结果
   */
  private renderFrameToOffscreen(): void {
    if (!this.offscreenCtx || !this.offscreenCanvas) return;

    // 清空离屏画布
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    try {
      if (this.spriteSheet && this.images[0]) {
        // 使用精灵表渲染到离屏Canvas
        const { frameWidth, frameHeight, rows = 1, columns = 1 } = this.spriteSheet;
        const spriteImg = this.images[0];

        // 确定当前帧在精灵表中的位置
        let row, col;
        if (columns === 1 && rows > 1) {
          row = this.currentFrame;
          col = 0;
        } else if (rows === 1 && columns > 1) {
          row = 0;
          col = this.currentFrame;
        } else {
          row = Math.floor(this.currentFrame / columns);
          col = this.currentFrame % columns;
        }

        // 计算源图像裁剪区域
        const sx = col * frameWidth;
        const sy = row * frameHeight;

        this.offscreenCtx.imageSmoothingEnabled = false;
        this.offscreenCtx.drawImage(
          spriteImg,
          sx, sy, frameWidth, frameHeight,
          0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height
        );
      } else if (this.isSprite && this.images[0]) {
        // 使用精灵图渲染到离屏Canvas
        const spriteImg = this.images[0];
        let frameWidth, frameHeight, sx, sy;

        if (this.isVertical) {
          frameWidth = spriteImg.width;
          frameHeight = spriteImg.height / this.framesNum;
          sx = 0;
          sy = this.currentFrame * (frameHeight + this.spaceBetween);
        } else {
          frameWidth = spriteImg.width / this.framesNum;
          frameHeight = spriteImg.height;
          sx = this.currentFrame * (frameWidth + this.spaceBetween);
          sy = 0;
        }

        this.offscreenCtx.drawImage(
          spriteImg,
          sx, sy, frameWidth, frameHeight,
          0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height
        );
      } else if (this.images[this.currentFrame]) {
        // 使用序列帧渲染到离屏Canvas
        const img = this.images[this.currentFrame];
        this.offscreenCtx.drawImage(
          img,
          0, 0,
          this.offscreenCanvas.width,
          this.offscreenCanvas.height
        );
      }
    } catch (error) {
      console.error('离屏渲染出错:', error);
    }
  }

  /**
   * 缓存当前帧
   */
  private cacheCurrentFrame(): void {
    if (!this.useFrameCache || !this.ctx) return;

    try {
      // 获取当前画布内容作为缓存
      const imageData = this.ctx.getImageData(
        0, 0,
        this.canvas.width,
        this.canvas.height
      );

      this.frameCache.set(this.currentFrame, imageData);

      // 清理缓存，避免内存泄漏
      this.cleanupCache();
    } catch (e) {
      console.warn('无法缓存帧数据:', e);
    }
  }

  /**
   * 清理过多的缓存数据
   */
  private cleanupCache(): void {
    if (this.frameCache.size <= this.maxCacheFrames) return;

    // 找到最早的几个缓存项删除
    const keysToDelete = Array.from(this.frameCache.keys())
      .slice(0, this.frameCache.size - this.maxCacheFrames);

    // 删除超出限制的缓存项
    for (const key of keysToDelete) {
      this.frameCache.delete(key);
    }
  }

  // 取消动画方法 - 添加这个重要的辅助方法
  private cancelAnimation(): void {
    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
      this.animationRequestId = undefined;
    }
  }

  /**
   * 设置显示指定索引的帧
   * @param idx 帧索引
   */
  setFrameByIndex(idx: number): void {
    super.setFrameByIndex(idx); // 调用基类方法更新currentFrame
    this.draw(); // 手动调用渲染方法
  }
}
