/**
 * 图片加载回调函数类型
 * @param img 已加载的图片元素
 * @param event 加载事件对象
 */
type LoadCallback = (img: HTMLImageElement, event: Event) => void;

/**
 * 图片预加载器
 * 负责批量加载图片资源，提供加载进度回调，并在全部加载完成后通知
 * 用于确保动画开始前所有图片资源已准备就绪，避免播放过程中出现加载延迟
 */
export class Preloader {
  /** 已加载图片的缓存数组，索引与传入的URL数组对应 */
  private loadCache: HTMLImageElement[] = [];
  /** 是否所有图片都已加载完成 */
  public isLoaded = false;

  /**
   * 创建一个图片预加载器实例
   * @param imgs 要加载的图片URL数组
   * @param onLoading 加载进度回调函数，参数为0-1之间的进度值
   * @param onComplete 加载完成回调函数，参数为加载完成的图片元素数组
   */
  constructor(
    private imgs: string[],
    private onLoading: (progress: number) => void,
    private onComplete: (images: HTMLImageElement[]) => void
  ) {
    this.loadImages();
  }

  /**
   * 加载单张图片
   * 创建Image元素并设置加载事件处理
   * @param url 图片URL地址
   * @param index 在图片数组中的索引位置
   * @returns Promise对象，解析为加载完成的图片元素
   */
  private loadImage(url: string, index: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = (e) => {
        this.loadCache[index] = img;
        this.progressHandler();
        resolve(img);
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  /**
   * 批量加载所有图片
   * 并行处理所有图片的加载过程，完成后调用回调
   */
  private async loadImages() {
    const promises = this.imgs.map((url, i) => this.loadImage(url, i));
    await Promise.all(promises);
    this.isLoaded = true;
    this.onComplete(this.loadCache);
  }

  /**
   * 处理并报告加载进度
   * 计算当前已加载图片比例并触发进度回调
   */
  private progressHandler() {
    const loaded = this.loadCache.filter(Boolean).length;
    this.onLoading(loaded / this.imgs.length);
  }
}
