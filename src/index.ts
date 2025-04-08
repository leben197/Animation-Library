import { CanvasAnimator } from "./CanvasAnimator";
import { CSS3Animator } from "./CSS3Animator";
import { Preloader } from "./Preloader";
import { SpineAnimator } from "./SpineAnimator"; // 导入新的骨骼动画渲染器
import { AnimationInterface, FrameOptions } from "./types";
import { SpineAnimationInterface } from "./types/spine"; // 导入骨骼动画接口
import { WebGLAnimator } from "./WebGLAnimator"; // 导入新的WebGL渲染器

/**
 * Frame - 动画库的主要接口类
 * 封装了动画加载、渲染器选择和动画控制功能
 * 会根据配置或浏览器支持情况自动选择Canvas或CSS3渲染方式
 */
export class Frame implements AnimationInterface {
  /** 实际执行动画的渲染器实例 */
  private animator!: AnimationInterface;
  /** 图片预加载器实例 */
  private preloader!: Preloader;

  /**
   * 创建一个新的动画实例
   * @param options 动画配置选项，包含图片路径、尺寸和行为设置
   */
  constructor(options: FrameOptions) {
    // 如果是骨骼动画，则直接创建SpineAnimator
    if (options.renderer === 'spine') {
      this.animator = new SpineAnimator(options);
      options.onReady?.();
      return;
    }

    // 其他类型的动画走原来的逻辑
    this.init(options);
  }

  /**
   * 设置动画显示特定帧
   * @param idx 要显示的帧索引
   */
  setFrameByIndex = (idx: number): void => {
    this.animator?.setFrameByIndex?.(idx);
  };

  /**
   * 初始化动画实例
   * 加载所有指定的图片，并在加载完成后创建合适的渲染器
   * @param options 动画配置选项
   */
  private async init(options: FrameOptions) {
    // 使用isSprite或spriteSheet判断是否为精灵图模式
    const isUsingSprite = options.isSprite || !!options.spriteSheet;

    // 添加进度日志
    const onProgress = (progress: number) => {
      const percent = Math.round(progress * 100);
      // 可以添加自定义进度回调
      if (typeof options.onProgress === 'function') {
        options.onProgress(progress);
      }
    };

    this.preloader = new Preloader(
      options.imgs || [], // 确保传递一个数组，即使options.imgs是undefined
      onProgress,
      (images) => {
        this.animator = this.createAnimator(options, images);
        options.onReady?.();
        if (options.autoPlay) {
          // 稍微延迟自动播放以确保渲染器已准备就绪
          setTimeout(() => this.play(), 50);
        }
      },
      options.isSprite,
      options.spriteSheet
    );
  }

  /**
   * 创建合适的动画渲染器
   * 根据用户指定的renderer选项或浏览器支持情况选择渲染方式
   * @param options 动画配置选项
   * @param images 已加载的图像元素数组
   * @returns 创建的动画渲染器实例
   */
  private createAnimator(
    options: FrameOptions,
    images: HTMLImageElement[]
  ): AnimationInterface {
    // 根据renderer选项决定使用哪种渲染器
    const renderer = options.renderer || 'auto';

    if (renderer === 'canvas') {
      return new CanvasAnimator(options, images);
    } else if (renderer === 'css') {
      return new CSS3Animator(options, images);
    } else if (renderer === 'spine') {
      // 骨骼动画应该在构造函数中直接处理，这里是防止某些情况下的回退
      return new SpineAnimator(options);
    } else if (renderer === 'webgl') {
      // 使用WebGL渲染器
      return new WebGLAnimator(options, images);
    } else {
      // 'auto'模式 - 根据浏览器支持情况选择
      if (this.supportsWebGL()) {
        // 优先使用WebGL渲染
        return new WebGLAnimator(options, images);
      } else if (this.supportsCSS3Animations()) {
        return new CSS3Animator(options, images);
      }
      return new CanvasAnimator(options, images);
    }
  }

  /**
   * 检测浏览器是否支持CSS3动画
   * 用于auto模式下自动选择最佳渲染器
   * @returns 如果浏览器支持CSS3动画则返回true，否则返回false
   */
  private supportsCSS3Animations(): boolean {
    return CSS.supports("animation", "test");
  }

  /**
   * 检测浏览器是否支持WebGL
   * 用于auto模式下自动选择最佳渲染器
   */
  private supportsWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  /**
   * 开始播放动画
   * @param stopAtBeginning 是否从第一帧开始播放，默认为false
   * @param idx 指定开始播放的帧索引
   */
  play(stopAtBeginning?: boolean, idx?: number): void {
    this.animator?.play(stopAtBeginning, idx);
  }

  /**
   * 暂停动画播放
   * 停止在当前帧，可以稍后通过play方法恢复播放
   */
  pause(): void {
    this.animator?.pause();
  }

  /**
   * 停止动画播放并重置到第一帧
   * 与pause不同，stop会重置动画状态
   */
  stop(): void {
    this.animator?.stop();
  }

  /**
   * 获取骨骼动画渲染器实例
   * 当使用骨骼动画时，可以访问更多骨骼特有的API
   */
  getSpineAnimator(): SpineAnimationInterface | null {
    if (this.animator instanceof SpineAnimator) {
      return this.animator as SpineAnimationInterface;
    }
    return null;
  }
}


// 内联导出所有类型，避免外部导入
// export type { AnimationInterface, FrameOptions, SpriteSheetOptions } from './types';

// 使用重新导出方式,将类型内联到最终的d.ts文件
export * from './types';
