import { AnimationInterface, FrameOptions } from "./types";

/**
 * Canvas动画渲染器
 * 使用Canvas API实现帧动画效果，通过绘制图像序列实现动画
 * 适用于需要高性能动画或特殊视觉效果的场景
 */
export class CanvasAnimator implements AnimationInterface {
/** Canvas元素 */
  private canvas!: HTMLCanvasElement;
  /** Canvas 2D渲染上下文 */
  private ctx!: CanvasRenderingContext2D;
  /** 动画帧请求ID，用于取消动画 */
  private animationFrameId!: number;
  /** 当前显示的帧索引 */
  private currentIndex = 0;
  /** 动画是否正在播放 */
  private isPlaying = false;

  /**
   * 创建Canvas动画渲染器
   * @param options 动画配置选项
   * @param images 预加载的图像元素数组
   */
  constructor(
    private options: FrameOptions,
    private images: HTMLImageElement[]
  ) {
    this.initCanvas();
    this.renderFrame();
  }

  /**
   * 初始化Canvas元素
   * 创建Canvas并添加到指定的容器中
   */
  private initCanvas() {
    // 创建Canvas元素
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    // 获取绘图上下文
    this.ctx = this.canvas.getContext("2d")!;

    // 获取容器元素，支持选择器字符串或DOM元素
    const container = typeof this.options.frameWrap === "string"
      ? document.querySelector(this.options.frameWrap)
      : this.options.frameWrap;

    // 将Canvas添加到容器
    container?.appendChild(this.canvas);
  }

  /**
   * 开始播放动画
   * @param stopAtBeginning 是否从第一帧开始播放，默认为false
   */
  play(stopAtBeginning = false) {
    // 如果已经在播放，则不执行任何操作
    if (this.isPlaying) return;

    this.isPlaying = true;
    let lastTime = performance.now();

    // 动画循环函数
    const animate = () => {
      if (!this.isPlaying) return;

      // 基于时间间隔控制帧率
      const now = performance.now();
      if (now - lastTime >= (this.options.speed || 100)) {
        // 更新到下一帧并循环
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.renderFrame();
        lastTime = now;
      }
      // 请求下一帧
      this.animationFrameId = requestAnimationFrame(animate);
    };

    // 启动动画循环
    animate();
  }

  /**
   * 渲染当前帧到Canvas
   * 清除之前的内容并绘制新的帧
   */
  private renderFrame() {
    // 清除整个Canvas区域
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    // 绘制当前帧图像
    this.ctx.drawImage(
      this.images[this.currentIndex],
      0,
      0,
      this.options.width,
      this.options.height
    );
  }

  /**
   * 暂停动画播放
   * 停止动画循环但保留当前帧
   */
  pause() {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * 停止动画播放
   * 重置到第一帧，并取消动画循环
   */
  stop() {
    this.pause();
    this.currentIndex = 0;
    this.renderFrame();
  }
}
