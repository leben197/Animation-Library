import { FrameOptions } from "./types";

export class CanvasAnimator {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId!: number;
  private currentIndex = 0;
  private isPlaying = false;

  constructor(
    private options: FrameOptions,
    private images: HTMLImageElement[]
  ) {
    this.initCanvas();
  }

  private initCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.ctx = this.canvas.getContext("2d")!;

    const container = typeof this.options.frameWrap === "string"
      ? document.querySelector(this.options.frameWrap)
      : this.options.frameWrap;

    container?.appendChild(this.canvas);
  }

  play(stopAtBeginning = false) {
    if (this.isPlaying) return;

    this.isPlaying = true;
    let lastTime = performance.now();

    const animate = () => {
      if (!this.isPlaying) return;

      const now = performance.now();
      if (now - lastTime >= (this.options.speed || 100)) {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.renderFrame();
        lastTime = now;
      }
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private renderFrame() {
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    this.ctx.drawImage(
      this.images[this.currentIndex],
      0,
      0,
      this.options.width,
      this.options.height
    );
  }

  pause() {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  stop() {
    this.pause();
    this.currentIndex = 0;
    this.renderFrame();
  }
}
