import { AnimationInterface, FrameOptions } from "./types";

/**
 * CSS3动画渲染器
 * 使用DOM和CSS实现帧动画效果，通过显示/隐藏div元素实现帧切换
 * 相比Canvas渲染，在某些设备上可能有更好的性能表现
 */
export class CSS3Animator implements AnimationInterface {
  /** 容器元素，用于包含所有帧 */
  private container!: HTMLElement;
  /** 所有动画帧的DOM元素数组 */
  private frames: HTMLDivElement[] = [];
/** 当前显示的帧索引 */
  private currentIndex = 0;
  /** 动画是否正在播放 */
  private isPlaying = false;
  /** 动画间隔定时器ID */
  private animationInterval: number | null = null;

  /**
   * 创建CSS3动画渲染器
   * @param options 动画配置选项
   * @param images 预加载的图像元素数组
   */
  constructor(
    private options: FrameOptions,
    private images: HTMLImageElement[]
  ) {
    this.initContainer();
    this.createFrames();
  }

  /**
   * 初始化容器元素
   * 创建一个div容器并添加到指定的父元素中
   */
  private initContainer() {
    // 获取父容器，支持选择器字符串或DOM元素
    const parentContainer = typeof this.options.frameWrap === "string"
      ? document.querySelector(this.options.frameWrap) as HTMLElement
      : this.options.frameWrap;

    // 验证父容器是否有效
    if (!parentContainer) {
      throw new Error("Invalid frameWrap element");
    }

    // 创建并设置容器样式
    this.container = document.createElement('div');
    this.container.style.width = `${this.options.width}px`;
    this.container.style.height = `${this.options.height}px`;
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';

    // 将容器添加到父元素
    parentContainer.appendChild(this.container);
  }

  /**
   * 为每个图片创建对应的DOM元素
   * 每个图片将成为一个绝对定位的div，以背景图片形式显示
   */
  private createFrames() {
    this.images.forEach((img, index) => {
      const frame = document.createElement('div');

      // 设置帧样式
      frame.style.position = 'absolute';
      frame.style.top = '0';
      frame.style.left = '0';
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.backgroundImage = `url(${img.src})`;
      frame.style.backgroundSize = 'cover';
      frame.style.backgroundPosition = 'center';
      frame.style.display = index === 0 ? 'block' : 'none'; // 初始只显示第一帧

      this.frames.push(frame);
      this.container.appendChild(frame);
    });

    // 确保至少有一个初始可见帧
    if (this.frames.length > 0) {
      this.frames[0].style.display = 'block';
    }
  }

  /**
   * 开始播放动画
   * @param stopAtBeginning 是否从第一帧开始播放，默认为false
   */
  play(stopAtBeginning = false) {
  // 如果已经在播放，则不执行任何操作
    if (this.isPlaying) return;

    this.isPlaying = true;

    // 如果需要从头开始播放
    if (stopAtBeginning) {
      this.currentIndex = 0;
      this.showFrame(this.currentIndex);
    }

    // 使用速度选项来确定帧率，默认100ms
    const frameDelay = this.options.speed || 100;

    // 设置定时器，按指定间隔切换帧
    this.animationInterval = window.setInterval(() => {
      // 隐藏当前帧
      this.frames[this.currentIndex].style.display = 'none';

      // 移到下一帧，循环播放
      this.currentIndex = (this.currentIndex + 1) % this.frames.length;

      // 显示新帧
      this.showFrame(this.currentIndex);
    }, frameDelay);
  }

  /**
   * 显示指定索引的帧
   * @param index 要显示的帧索引
   */
  private showFrame(index: number) {
    if (this.frames[index]) {
      this.frames[index].style.display = 'block';
    }
  }

  /**
   * 暂停动画播放
   * 保留当前帧，可以稍后恢复
   */
  pause() {
    this.isPlaying = false;
    if (this.animationInterval !== null) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  /**
   * 停止动画播放
   * 重置到第一帧，并清除定时器
   */
  stop() {
    this.pause();
    this.currentIndex = 0;

    // 隐藏所有帧除了第一帧
    this.frames.forEach((frame, index) => {
      frame.style.display = index === 0 ? 'block' : 'none';
    });
  }
}
