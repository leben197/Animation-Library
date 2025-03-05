import { FrameOptions } from "./types";

export class CSS3Animator {
  private container: HTMLElement | undefined;
  private currentIndex = 0;
  private isPlaying = false;
  private animationFrameId: number | undefined;
  private lastTime = 0;
  private imgs: HTMLImageElement[] = [];

  constructor(
    private options: FrameOptions,
    images: HTMLImageElement[]
  ) {
    this.initContainer();
    this.createImageElements(images);
  }

  private initContainer() {
    const container = typeof this.options.frameWrap === "string"
      ? document.querySelector(this.options.frameWrap)
      : this.options.frameWrap;

    if (!container) throw new Error('Invalid frameWrap element');
    this.container = container as HTMLElement;
    this.container.style.overflow = 'hidden';
    this.container.style.position = 'relative';
  }

  private createImageElements(images: HTMLImageElement[]) {
    this.imgs = images.map((img, index) => {
      const element = img.cloneNode() as HTMLImageElement;
      element.style.cssText = `
        position: absolute;
        width: ${this.options.width}px;
        height: ${this.options.height}px;
        left: ${index * (this.options.width + (this.options.spaceBetween || 0))}px;
        opacity: ${index === 0 ? 1 : 0};
        transition: opacity 0.3s ease-in-out;
      `;
      this.container?.appendChild(element);
      return element;
    });
  }

  play(stopAtBeginning = false, idx?: number) {
    if (this.isPlaying) return;

    if (typeof idx === 'number') {
      this.currentIndex = Math.min(Math.max(idx, 0), this.imgs.length - 1);
    }

    this.isPlaying = true;
    this.lastTime = performance.now();

    const animate = () => {
      if (!this.isPlaying) return;

      const now = performance.now();
      if (now - this.lastTime >= (this.options.speed || 100)) {
        this.updateFrame();
        this.lastTime = now;
      }
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private updateFrame() {
    this.imgs.forEach((img, index) => {
      img.style.opacity = index === this.currentIndex ? '1' : '0';
    });

    this.currentIndex = (this.currentIndex + 1) % this.imgs.length;

    if (!this.options.loop && this.currentIndex === 0) {
      this.stop();
    }
  }

  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  stop() {
    this.pause();
    this.currentIndex = 0;
    this.imgs.forEach((img, index) => {
      img.style.opacity = index === 0 ? '1' : '0';
    });
  }

  destroy() {
    this.stop();
    this.imgs.forEach(img => img.remove());
  }
}
