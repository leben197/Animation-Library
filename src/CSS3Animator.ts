import { AnimationInterface, FrameOptions, SpriteSheetOptions } from "./types";

/**
 * CSS3动画渲染器
 * 使用两种渲染模式:
 * - 精灵图/精灵表: 单一背景图位置变化
 * - 多图序列: 使用两个交替元素平滑切换
 */
export class CSS3Animator implements AnimationInterface {
  /** 动画容器元素 */
  private container: HTMLElement;
  /** 主动画元素 - 用于精灵图模式 */
  private animElement: HTMLDivElement;

  // 双元素交替显示系统 - 只创建2个DOM元素
  private frontLayer: HTMLDivElement;
  private backLayer: HTMLDivElement;
  private isFrontActive = true;

  /** 当前动画帧索引 */
  private currentFrame = 0;
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
  private spriteSheet?: SpriteSheetOptions;
  /** 回调函数 */
  private onPlay?: (instance: any) => void;
  private onPaused?: (instance: any) => void;
  private onStop?: (instance: any) => void;
  private onEnded?: (instance: any) => void;
  /** 动画状态 */
  private isPlaying = false;
  /** 是否为垂直排列的精灵图 */
  private isVertical = false;
  /** 动画请求ID */
  private animationRequestId?: number;
  /** 帧间隔时间(毫秒) */
  private frameInterval: number;
  /** 是否使用双层交替模式 */
  private useLayerSwapping = false;
  /** 预加载图像状态 */
  private preloadedImages: Set<string> = new Set();

  constructor(private options: FrameOptions, images: HTMLImageElement[]) {
    // 处理frameWrap
    if (typeof options.frameWrap === 'string') {
      const element = document.querySelector(options.frameWrap);
      if (!element) throw new Error(`找不到元素: ${options.frameWrap}`);
      this.container = element as HTMLElement;
    } else {
      this.container = options.frameWrap;
    }

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

    // 设置容器样式
    this.container.style.position = 'relative';
    this.container.style.width = `${options.width}px`;
    this.container.style.height = `${options.height}px`;
    this.container.style.overflow = 'hidden';

    // 检测是否为垂直精灵图
    if (this.spriteSheet && images[0]) {
      if (this.spriteSheet.rows && this.spriteSheet.columns) {
        this.isVertical = this.spriteSheet.rows > 1 && this.spriteSheet.columns === 1;
      } else {
        this.isVertical = images[0].width === this.spriteSheet.frameWidth;
      }
    } else if (this.isSprite && images[0]) {
      this.isVertical = images[0].height > images[0].width * 2;
    }

    // 决定使用哪种渲染模式
    this.useLayerSwapping = !this.isSprite && !this.spriteSheet && images.length > 1;

    if (this.useLayerSwapping) {
      // 多图序列：创建双层交替系统
      this.initLayerSwappingMode();
    } else {
      // 精灵图：创建单层背景定位系统
      this.initSingleElementMode();
    }

    // 预加载图像
    this.preloadImages();

    // 显示第一帧
    this.setFrameByIndex(0);
  }

  /**
   * 预加载所有图像到浏览器缓存
   * 这对于解决闪帧问题非常重要
   */
  private preloadImages(): void {
    // 创建一个隐藏的预加载容器
    const preloadContainer = document.createElement('div');
    preloadContainer.style.position = 'absolute';
    preloadContainer.style.width = '0';
    preloadContainer.style.height = '0';
    preloadContainer.style.opacity = '0';
    preloadContainer.style.visibility = 'hidden';
    preloadContainer.style.overflow = 'hidden';
    document.body.appendChild(preloadContainer);

    // 如果是精灵图，只需加载一张
    if (this.isSprite || this.spriteSheet) {
      if (this.images[0]) {
        this.preloadedImages.add(this.images[0].src);
      }
      return;
    }

    // 对于序列帧，预加载所有图像
    this.images.forEach(img => {
      const preloadImg = new Image();
      preloadImg.src = img.src;
      // 将图像添加到DOM以确保浏览器进行渲染缓存
      preloadContainer.appendChild(preloadImg);
      preloadImg.onload = () => {
        this.preloadedImages.add(img.src);
      };
    });
  }

  /**
   * 初始化双层交替模式 - 只创建两个DOM元素
   * 这是解决闪帧的关键 - 新帧显示前先在后台层准备好
   */
  private initLayerSwappingMode(): void {
    // 创建两个层，它们会交替显示
    this.frontLayer = document.createElement('div');
    this.backLayer = document.createElement('div');

    // 设置基本样式
    const layerStyle = {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      transition: 'opacity 0ms ease', // 0ms是关键，避免过渡动画
      willChange: 'opacity, background-image',
      transformStyle: 'preserve-3d', // 启用硬件加速
      backfaceVisibility: 'hidden',  // 避免闪烁
      transform: 'translateZ(0)',    // 强制GPU加速
    };

    // 应用样式到两个层
    Object.assign(this.frontLayer.style, layerStyle);
    Object.assign(this.backLayer.style, layerStyle);

    // 初始状态：前层可见，后层隐藏
    this.frontLayer.style.opacity = '1';
    this.backLayer.style.opacity = '0';

    // 添加到DOM
    this.container.appendChild(this.backLayer);  // 背景在下
    this.container.appendChild(this.frontLayer); // 前景在上

    // 初始化第一帧
    if (this.images[0]) {
      this.frontLayer.style.backgroundImage = `url(${this.images[0].src})`;
    }

    // 兼容性 - animElement在这种模式下指向前层
    this.animElement = this.frontLayer;
  }

  /**
   * 初始化单元素模式 - 用于精灵图/精灵表
   */
  private initSingleElementMode(): void {
    this.animElement = document.createElement('div');
    this.animElement.style.width = '100%';
    this.animElement.style.height = '100%';
    this.animElement.style.position = 'relative';

    // 设置背景
    if (this.images[0]) {
      this.animElement.style.backgroundImage = `url(${this.images[0].src})`;
      this.animElement.style.backgroundRepeat = 'no-repeat';
      this.configSpriteBackgroundSize();
    }

    this.container.appendChild(this.animElement);

    // 在这种模式下不需要双层
    this.frontLayer = this.animElement;
    this.backLayer = this.animElement;
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
   * 配置精灵图或精灵表的背景尺寸
   */
  private configSpriteBackgroundSize() {
    // 现有实现保持不变...
    if (!this.images[0]) return;

    const spriteImg = this.images[0];

    if (this.spriteSheet) {
      const { frameWidth, frameHeight, rows = 1, columns = 1 } = this.spriteSheet;

      // 计算缩放比例
      const scaleX = this.options.width / frameWidth;
      const scaleY = this.options.height / frameHeight;

      if (columns === 1 && rows > 1) {
        // 垂直排列精灵表
        const totalHeight = rows * frameHeight;
        const scaledHeight = totalHeight * scaleX;
        this.animElement.style.backgroundSize = `${this.options.width}px ${scaledHeight}px`;
      } else if (rows === 1 && columns > 1) {
        // 水平排列精灵表
        const totalWidth = columns * frameWidth;
        const scaledWidth = totalWidth * scaleY;
        this.animElement.style.backgroundSize = `${scaledWidth}px ${this.options.height}px`;
      } else {
        // 网格排列精灵表
        const totalWidth = columns * frameWidth;
        const totalHeight = rows * frameHeight;
        const scale = Math.min(scaleX, scaleY);
        this.animElement.style.backgroundSize = `${totalWidth * scale}px ${totalHeight * scale}px`;
      }
    } else if (this.isSprite) {
      if (this.isVertical) {
        // 垂直排列精灵图
        const scaleX = this.options.width / spriteImg.width;
        const scaledHeight = spriteImg.height * scaleX;
        this.animElement.style.backgroundSize = `${this.options.width}px ${scaledHeight}px`;
      } else {
        // 水平排列精灵图
        const scaleY = this.options.height / spriteImg.height;
        const scaledWidth = spriteImg.width * scaleY;
        this.animElement.style.backgroundSize = `${scaledWidth}px ${this.options.height}px`;
      }
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
        this.setFrameByIndex(idx);
      }
    }

    // 所有动画都使用requestAnimationFrame
    this.playWithAnimationFrame();

    this.onPlay?.(this);
  }

  /**
   * 使用requestAnimationFrame播放动画
   */
  private playWithAnimationFrame(): void {
    this.cancelAnimation();

    let lastFrameTime = 0;
    let nextFramePreloaded = false;

    // 第一帧预加载下一帧
    if (this.useLayerSwapping) {
      this.preloadNextFrame((this.currentFrame + 1) % this.images.length);
    }

    const frameLoop = (timestamp: number) => {
      if (!this.isPlaying) return;

      if (!lastFrameTime || timestamp - lastFrameTime >= this.frameInterval) {
        // 更新帧索引
        this.currentFrame++;
        if (this.currentFrame >= this.getFrameCount()) {
          if (this.loop) {
            this.currentFrame = 0;
          } else {
            this.isPlaying = false;
            this.setFrameByIndex(this.getFrameCount() - 1);
            this.onEnded?.(this);
            return;
          }
        }

        // 显示当前帧
        this.setFrameByIndex(this.currentFrame);

        // 重置预加载标志
        nextFramePreloaded = false;
        lastFrameTime = timestamp;
      } else if (!nextFramePreloaded && this.useLayerSwapping) {
        // 在等待下一帧时间的间隙，预加载下下一帧
        const nextNextFrame = (this.currentFrame + 1) % this.getFrameCount();
        this.preloadNextFrame(nextNextFrame);
        nextFramePreloaded = true;
      }

      this.animationRequestId = requestAnimationFrame(frameLoop);
    };

    this.animationRequestId = requestAnimationFrame(frameLoop);
  }

  /**
   * 预加载下一帧到非活动层
   */
  private preloadNextFrame(nextFrameIdx: number): void {
    if (!this.useLayerSwapping || nextFrameIdx >= this.images.length) return;

    // 预加载到当前非活动的层
    const inactiveLayer = this.isFrontActive ? this.backLayer : this.frontLayer;

    if (this.images[nextFrameIdx]) {
      inactiveLayer.style.backgroundImage = `url(${this.images[nextFrameIdx].src})`;
    }
  }

  /**
   * 取消动画
   */
  private cancelAnimation(): void {
    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
      this.animationRequestId = undefined;
    }
  }

  /**
   * 设置显示指定索引的帧
   */
  setFrameByIndex(idx: number): void {
    // 确保索引在有效范围内
    idx = Math.max(0, Math.min(idx, this.getFrameCount() - 1));

    if (this.useLayerSwapping) {
      // 双层交替模式
      this.setFrameWithLayerSwapping(idx);
    } else if (this.isSprite && this.images[0]) {
      // 精灵图模式
      this.setSpritePosition(idx);
    } else if (this.spriteSheet && this.images[0]) {
      // 精灵表模式
      this.setSpriteSheetPosition(idx);
    }

    this.currentFrame = idx;
  }

  /**
   * 使用层交替设置帧 - 无闪帧切换的核心实现
   */
  private setFrameWithLayerSwapping(idx: number): void {
    // 确保有图像可用
    if (!this.images[idx]) return;

    // 获取当前活动和非活动层
    const activeLayer = this.isFrontActive ? this.frontLayer : this.backLayer;
    const inactiveLayer = this.isFrontActive ? this.backLayer : this.frontLayer;

    // 1. 如果非活动层没有正确的图像，设置它
    if (inactiveLayer.style.backgroundImage !== `url("${this.images[idx].src}")`) {
      inactiveLayer.style.backgroundImage = `url(${this.images[idx].src})`;
    }

    // 2. 执行层切换 - 这是避免闪帧的核心
    inactiveLayer.style.opacity = '1';  // 显示有新帧的层
    activeLayer.style.opacity = '0';    // 隐藏旧的层

    // 3. 交换层状态
    this.isFrontActive = !this.isFrontActive;
  }

  /**
   * 设置精灵图位置
   */
  private setSpritePosition(idx: number): void {
    // 精灵图定位代码保持不变...
    const spriteImg = this.images[0];

    if (this.isVertical) {
      // 垂直精灵图
      const frameHeight = spriteImg.height / this.framesNum;
      // 计算缩放比例
      const scaleX = this.options.width / spriteImg.width;
      const posY = -(idx * frameHeight * scaleX);
      this.animElement.style.backgroundPosition = `0 ${posY}px`;
    } else {
      // 水平精灵图
      const frameWidth = spriteImg.width / this.framesNum;
      // 计算缩放比例
      const scaleY = this.options.height / spriteImg.height;
      const posX = -(idx * frameWidth * scaleY);
      this.animElement.style.backgroundPosition = `${posX}px 0`;
    }
  }

  /**
   * 设置精灵表位置
   */
  private setSpriteSheetPosition(idx: number): void {
    // 精灵表定位代码保持不变...
    const { frameWidth, frameHeight, columns = 1, rows = 1 } = this.spriteSheet!;

    // 计算缩放比例
    const scaleX = this.options.width / frameWidth;
    const scaleY = this.options.height / frameHeight;

    if (columns === 1) {
      // 垂直精灵表
      const posY = -(idx * frameHeight * scaleX);
      this.animElement.style.backgroundPosition = `0 ${posY}px`;
    } else if (rows === 1) {
      // 水平精灵表
      const posX = -(idx * frameWidth * scaleY);
      this.animElement.style.backgroundPosition = `${posX}px 0`;
    } else {
      // 网格精灵表
      const scale = Math.min(scaleX, scaleY);
      const col = idx % columns;
      const row = Math.floor(idx / columns);
      const posX = -(col * frameWidth * scale);
      const posY = -(row * frameHeight * scale);
      this.animElement.style.backgroundPosition = `${posX}px ${posY}px`;
    }
  }

  /**
   * 暂停动画播放
   */
  pause(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.cancelAnimation();
    this.onPaused?.(this);
  }

  /**
   * 停止动画播放并重置到第一帧
   */
  stop(): void {
    this.isPlaying = false;
    this.cancelAnimation();

    // 重置到第一帧
    this.currentFrame = 0;
    this.setFrameByIndex(0);
    this.onStop?.(this);
  }
}
