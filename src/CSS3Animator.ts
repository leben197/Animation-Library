import { BaseAnimator } from "./BaseAnimator";
import { FrameOptions } from "./types";

/**
 * CSS3动画渲染器
 */
export class CSS3Animator extends BaseAnimator {
  /** 动画容器元素 */
  private container: HTMLElement;
  /** 主动画元素 */
  private animElement!: HTMLDivElement;
  /** 预加载图像状态 */
  private preloadedImages: Set<string> = new Set();

  constructor(options: FrameOptions, images: HTMLImageElement[]) {
    super(options, images);

    // 处理frameWrap
    if (typeof options.frameWrap === 'string') {
      const element = document.querySelector(options.frameWrap);
      if (!element) throw new Error(`找不到元素: ${options.frameWrap}`);
      this.container = element as HTMLElement;
    } else {
      this.container = options.frameWrap;
    }

    // 设置容器样式
    this.container.style.position = 'relative';
    this.container.style.width = `${options.width}px`;
    this.container.style.height = `${options.height}px`;
    this.container.style.overflow = 'hidden';
    this.container.style.willChange = 'transform';
    this.container.style.transform = 'translateZ(0)';

    // 创建单个动画元素
    this.initAnimationElement();

    // 预加载图像
    this.preloadImages();

    // 显示第一帧
    this.setFrameByIndex(0);
  }

  // 实现抽象方法
  protected startAnimationLoop(): void {
    this.animateWithRequestAnimationFrame();
  }

  // 实现抽象方法 - 修复无限递归问题
  protected renderFrame(): void {
    // 不再调用 setFrameByIndex，而是直接实现帧渲染逻辑
    if (this.isSprite || this.spriteSheet) {
      // 精灵图/精灵表模式 - 改变背景位置
      if (this.isSprite) {
        this.setSpritePosition(this.currentFrame);
      } else if (this.spriteSheet) {
        this.setSpriteSheetPosition(this.currentFrame);
      }
    } else {
      // 多图序列模式 - 改变背景图像
      if (this.images[this.currentFrame]) {
        this.animElement.style.backgroundImage = `url(${this.images[this.currentFrame].src})`;
      }
    }
  }

  /**
   * 初始化单一动画元素
   */
  private initAnimationElement(): void {
    // 创建动画元素
    this.animElement = document.createElement('div');
    this.animElement.style.width = '100%';
    this.animElement.style.height = '100%';
    this.animElement.style.position = 'relative';
    this.animElement.style.backgroundSize = 'contain';
    this.animElement.style.backgroundPosition = 'center';
    this.animElement.style.backgroundRepeat = 'no-repeat';
    this.animElement.style.willChange = 'background-position, background-image';
    this.animElement.style.transform = 'translateZ(0)';  // 开启GPU加速

    // 如果是精灵图模式，需要配置背景尺寸
    if ((this.isSprite || this.spriteSheet) && this.images[0]) {
      this.animElement.style.backgroundImage = `url(${this.images[0].src})`;
      this.configSpriteBackgroundSize();
    }

    // 添加到容器
    this.container.appendChild(this.animElement);

    // 优化：确保首帧立即显示
    setTimeout(() => {
      if (!this.isPlaying && this.images[0]) {
        if (!this.isSprite && !this.spriteSheet) {
          this.animElement.style.backgroundImage = `url(${this.images[0].src})`;
        }
      }
    }, 0);
  }

  /**
   * 预加载所有图像到浏览器缓存
   */
  private preloadImages(): void {
    // 如果是精灵图模式，只需加载一张图片
    if (this.isSprite || this.spriteSheet) {
      if (this.images[0]) {
        this.preloadSingleImage(this.images[0].src);
        console.log('精灵图模式：加载单张图片');
      }
      return;
    }

    // 序列帧模式 - 确保加载所有帧，一个不漏
    console.log(`开始预加载所有${this.images.length}帧...`);

    // 创建隐藏的预加载容器
    const preloadContainer = document.createElement('div');
    preloadContainer.style.position = 'absolute';
    preloadContainer.style.left = '-9999px';
    preloadContainer.style.visibility = 'hidden';
    document.body.appendChild(preloadContainer);

    // 记录预加载状态
    const loadingStatus = new Array(this.images.length).fill(false);

    // 加载所有帧
    this.images.forEach((img, index) => {
      // 检查图像是否已经加载完成
      if (img.complete) {
        this.preloadedImages.add(img.src);
        loadingStatus[index] = true;
        console.log(`帧 ${index} 已加载完成(在构造函数就绪)`);
        return;
      }

      // 创建新图像进行预加载
      const preloadImg = new Image();

      // 设置加载成功处理程序
      preloadImg.onload = () => {
        this.preloadedImages.add(img.src);
        loadingStatus[index] = true;
        console.log(`帧 ${index} 加载完成`);
      };

      // 设置加载失败处理程序
      preloadImg.onerror = () => {
        console.error(`帧 ${index} 加载失败: ${img.src}`);
        // 尝试重新加载一次
        setTimeout(() => {
          const retryImg = new Image();
          retryImg.src = img.src;
          retryImg.onload = () => {
            this.preloadedImages.add(img.src);
            loadingStatus[index] = true;
            console.log(`帧 ${index} 重试加载成功`);
          };
          preloadContainer.appendChild(retryImg);
        }, 500);
      };

      // 设置图像源并添加到DOM以确保加载
      preloadImg.src = img.src;
      preloadContainer.appendChild(preloadImg);
    });

    // 检查加载状态并报告
    const checkInterval = setInterval(() => {
      const loadedCount = loadingStatus.filter(Boolean).length;
      console.log(`已加载 ${loadedCount}/${this.images.length} 帧`);

      if (loadedCount === this.images.length) {
        console.log('所有帧已成功预加载');
        clearInterval(checkInterval);

        // 延迟移除预加载容器
        setTimeout(() => {
          if (preloadContainer.parentNode) {
            preloadContainer.parentNode.removeChild(preloadContainer);
          }
        }, 1000);
      }
    }, 1000);
  }

  /**
   * 预加载单张图片
   */
  private preloadSingleImage(src: string): void {
    // 检查图片是否已经在集合中
    if (this.preloadedImages.has(src)) {
      console.log('图片已经预加载过');
      return;
    }

    // 创建新图像用于预加载
    const img = new Image();

    // 添加到文档以确保浏览器实际加载它
    img.style.position = 'absolute';
    img.style.left = '-9999px';
    img.style.visibility = 'hidden';
    document.body.appendChild(img);

    // 设置加载处理程序
    img.onload = () => {
      this.preloadedImages.add(src);
      console.log('图片预加载完成:', src);

      // 移除临时图像元素
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    };

    img.onerror = () => {
      console.error('图片加载失败:', src);

      // 尝试再次加载
      setTimeout(() => this.preloadSingleImage(src), 500);
    };

    // 最后设置src以开始加载
    img.src = src;
  }

  /**
   * 配置精灵图或精灵表的背景尺寸
   */
  private configSpriteBackgroundSize() {
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
   * 设置精灵图位置
   */
  private setSpritePosition(idx: number): void {
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
   * 重写setFrameByIndex以实现CSS特定的帧切换
   */
  setFrameByIndex(idx: number): void {
    // 不再调用 super.setFrameByIndex 以避免循环调用
    // 而是直接实现逻辑

    // 检查索引范围
    const frameCount = this.getFrameCount();
    if (idx < 0 || idx >= frameCount) {
      console.error(`帧索引超出范围: ${idx}`);
      return;
    }

    // 更新当前帧索引
    this.currentFrame = idx;

    // 直接调用渲染逻辑，但不通过renderFrame()方法
    if (this.isSprite || this.spriteSheet) {
      // 精灵图/精灵表模式 - 只需改变背景位置
      if (this.isSprite) {
        this.setSpritePosition(idx);
      } else if (this.spriteSheet) {
        this.setSpriteSheetPosition(idx);
      }
    } else {
      // 多图序列模式 - 改变背景图像
      if (this.images[idx]) {
        this.animElement.style.backgroundImage = `url(${this.images[idx].src})`;
      }
    }
  }
}
