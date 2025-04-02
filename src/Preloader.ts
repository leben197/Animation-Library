import { SpriteSheetOptions } from "./types";

/**
 * Preloader - 图片预加载器
 * 负责加载所有图片资源并跟踪加载进度
 */
export class Preloader {
  /** 已加载的图像元素数组 */
  private images: HTMLImageElement[] = [];
  /** 已加载的图像数量 */
  private loaded = 0;
  /** 需要加载的总图像数量 */
  private total = 0;
  /** 精灵图 */
  private spriteImage: HTMLImageElement | null = null;

  /**
   * 创建一个新的预加载器实例
   * @param imgPaths 需要加载的图像路径数组
   * @param onProgress 加载进度回调函数
   * @param onComplete 加载完成回调函数
   */
  constructor(
    private imgPaths: string[],
    private onProgress: (progress: number) => void,
    private onComplete: (images: HTMLImageElement[]) => void,
    private isSprite: boolean = false,
    private spriteSheet?: SpriteSheetOptions
  ) {
    if (isSprite || spriteSheet) {
      // 精灵模式下只需加载一张图像
      this.total = 1;
      const imgSrc = spriteSheet ? spriteSheet.src : (imgPaths.length > 0 ? imgPaths[0] : '');

      if (imgSrc) {
        this.spriteImage = new Image();
        this.spriteImage.onload = () => this.handleImageLoad(this.spriteImage!);
        this.spriteImage.onerror = () => {
          console.error(`Failed to load sprite image: ${imgSrc}`);
          this.handleImageLoad();
        };
        this.spriteImage.src = imgSrc;
      } else {
        console.error("No sprite image source provided");
        this.onComplete([]);
      }
    } else {
      // 常规模式，加载所有图像
      this.total = imgPaths.length;

      if (this.total === 0) {
        this.onComplete(this.images);
        return;
      }

      imgPaths.forEach((path) => {
        const img = new Image();
        img.onload = () => this.handleImageLoad(img);
        img.onerror = () => {
          console.error(`Failed to load image: ${path}`);
          this.handleImageLoad();
        };
        img.src = path;
      });
    }
  }

  /**
   * 处理单个图像加载完成事件
   */
  private handleImageLoad(img?: HTMLImageElement) {
    if (img) {
      this.images.push(img);
    }

    this.loaded++;
    const percentage = Math.round((this.loaded / this.total) * 100);

    this.onProgress(this.loaded / this.total);

    // 当所有图像加载完成时调用完成回调
    if (this.loaded === this.total) {


      // 验证所有图像是否真正加载完成
      const allComplete = this.images.every(img => img.complete);
      if (!allComplete) {
        console.warn('部分图像标记为加载完成，但实际未完成');
      }

      this.onComplete(this.images);
    }
  }
}
