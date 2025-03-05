type LoadCallback = (img: HTMLImageElement, event: Event) => void;

export class Preloader {
  private loadCache: HTMLImageElement[] = [];
  public isLoaded = false;

  constructor(
    private imgs: string[],
    private onLoading: (progress: number) => void,
    private onComplete: (images: HTMLImageElement[]) => void
  ) {
    this.loadImages();
  }

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

  private async loadImages() {
    const promises = this.imgs.map((url, i) => this.loadImage(url, i));
    await Promise.all(promises);
    this.isLoaded = true;
    this.onComplete(this.loadCache);
  }

  private progressHandler() {
    const loaded = this.loadCache.filter(Boolean).length;
    this.onLoading(loaded / this.imgs.length);
  }
}
