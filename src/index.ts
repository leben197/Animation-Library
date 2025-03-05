import { CanvasAnimator } from "./CanvasAnimator";
import { CSS3Animator } from "./CSS3Animator";
import { Preloader } from "./Preloader";
import { AnimationInterface, FrameOptions } from "./types";

export class Frame implements AnimationInterface {
  private animator!: AnimationInterface;
  private preloader!: Preloader;

  constructor(options: FrameOptions) {
    this.init(options);
  }

  private async init(options: FrameOptions) {
    this.preloader = new Preloader(
      options.imgs,
      (progress) => console.log(`Loading: ${progress * 100}%`),
      (images) => {
        this.animator = this.createAnimator(options, images);
        options.onReady?.();
        if (options.autoPlay) this.play();
      }
    );
  }

  private createAnimator(
    options: FrameOptions,
    images: HTMLImageElement[]
  ): AnimationInterface {
    if (this.supportsCSS3Animations()) {
      return new CSS3Animator(options, images);
    }
    return new CanvasAnimator(options, images);
  }

  private supportsCSS3Animations(): boolean {
    return CSS.supports("animation", "test");
  }

  play(stopAtBeginning?: boolean): void {
    this.animator?.play(stopAtBeginning);
  }

  pause(): void {
    this.animator?.pause();
  }

  stop(): void {
    this.animator?.stop();
  }
}
