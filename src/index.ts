import { CanvasAnimator } from "./CanvasAnimator";
import { CSS3Animator } from "./CSS3Animator";
import { Preloader } from "./Preloader";
import { AnimationInterface, FrameOptions } from "./types";

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
    this.init(options);
  }

  /**
   * 初始化动画实例
   * 加载所有指定的图片，并在加载完成后创建合适的渲染器
   * @param options 动画配置选项
   */
  private async init(options: FrameOptions) {
    // 使用isSprite或spriteSheet判断是否为精灵图模式
    const isUsingSprite = options.isSprite || !!options.spriteSheet;

    this.preloader = new Preloader(
      options.imgs,
      (progress) => console.log(`Loading: ${progress * 100}%`),
      (images) => {
        this.animator = this.createAnimator(options, images);
        options.onReady?.();
        if (options.autoPlay) this.play();
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
    } else {
      // 'auto'模式 - 根据浏览器支持情况选择
      if (this.supportsCSS3Animations()) {
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
}
// 显式导出类型，这是解决问题的关键
export type { AnimationInterface, FrameOptions };
