import { AnimationInterface, FrameOptions } from "./types";
import { SpineAnimationInterface, SpineOptions } from "./types/spine";

/**
 * 检查是否为骨骼动画配置
 */
function isSpineFrameOptions(options: FrameOptions): options is FrameOptions & { spine: SpineOptions } {
  return options.renderer === 'spine' && 'spine' in options;
}

/**
 * Spine骨骼动画渲染器
 * 支持Spine格式的2D骨骼动画渲染
 */
export class SpineAnimator implements AnimationInterface, SpineAnimationInterface {
  /** Canvas元素 */
  private canvas: HTMLCanvasElement;
  /** 骨骼动画对象 */
  private skeleton: any;
  /** 动画状态 */
  private state: any;
  /** 是否播放中 */
  private isPlaying = false;
  /** 骨骼数据 */
  private skeletonData: any;
  /** 动画播放速度 */
  private timeScale: number;
  /** 骨骼动画库实例 */
  private spine: any;
  /** 骨骼动画循环播放 */
  private loop: boolean;
  /** 回调函数 */
  private onPlay?: (instance: any) => void;
  private onPaused?: (instance: any) => void;
  private onStop?: (instance: any) => void;
  private onEnded?: (instance: any) => void;
  /** 动画请求ID */
  private animationRequestId?: number;
  /** 当前动画名称 */
  private currentAnimation?: string;
  /** 动画上次更新时间 */
  private lastTime = 0;
  /** Spine配置选项 */
  private spineOptions: SpineOptions;

  /**
   * 创建一个新的骨骼动画实例
   */
  constructor(private options: FrameOptions) {
    // 使用类型守卫验证是否有spine配置
    if (!isSpineFrameOptions(options)) {
      throw new Error('必须提供有效的Spine配置');
    }

    // 获取对应的spine配置
    this.spineOptions = options.spine;

    // 初始化配置参数
    this.timeScale = this.spineOptions.timeScale || 1;
    this.loop = this.spineOptions.loop !== false;

    // 存储回调函数
    this.onPlay = options.onPlay;
    this.onPaused = options.onPaused;
    this.onStop = options.onStop;
    this.onEnded = options.onEnded;

    // 创建Canvas元素用于渲染
    this.canvas = document.createElement('canvas');
    this.canvas.width = options.width;
    this.canvas.height = options.height;
    this.canvas.style.width = `${options.width}px`;
    this.canvas.style.height = `${options.height}px`;

    // 将Canvas添加到指定容器
    const container = typeof options.frameWrap === 'string'
      ? document.querySelector(options.frameWrap) as HTMLElement
      : options.frameWrap;

    if (!container) {
      throw new Error('找不到动画容器');
    }

    container.appendChild(this.canvas);

    // 加载骨骼动画资源
    this.loadSpineAssets(this.spineOptions).then(() => {
      // 加载完成后初始化动画
      this.initSkeleton();

      // 如果设置了autoPlay，自动开始播放
      if (options.autoPlay) {
        setTimeout(() => this.play(), 0);
      }

      options.onReady?.();
    }).catch(error => {
      console.error('加载骨骼动画资源失败:', error);
    });
  }

  /**
   * 加载骨骼动画资源
   */
  private async loadSpineAssets(options: SpineOptions): Promise<void> {
    try {
      // 动态导入Spine运行时
      const SpineRuntime = await this.loadSpineRuntime();
      this.spine = SpineRuntime;

      // 加载骨骼数据(JSON)
      const skeletonData = await fetch(options.jsonPath)
        .then(r => r.json());

      // 加载纹理集(atlas)
      const atlasData = await fetch(options.atlasPath)
        .then(r => r.text());

      // 加载纹理图像
      const texture = await this.loadTexture(options.texturePath);

      // 使用Spine运行时解析数据
      this.skeletonData = this.parseSpineData(skeletonData, atlasData, texture);

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * 加载Spine运行时
   * 可以动态导入Spine运行时库，或使用全局已加载的实例
   */
  private async loadSpineRuntime() {
    // 如果全局有Spine，直接使用
    if (typeof window !== 'undefined' && (window as any).spine) {
      return (window as any).spine;
    }

    // 否则动态加载
    // return import('path-to-spine-runtime').then(module => module.default);


    return {

      Skeleton: class { },
      AnimationState: class { },
      SkeletonJson: class {
        readSkeletonData() { return {}; }
      },
      AtlasAttachmentLoader: class { },
      TextureAtlas: class { }
    };
  }

  /**
   * 加载纹理图像
   */
  private loadTexture(path?: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (!path) {
        reject(new Error('缺少纹理路径'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`无法加载纹理: ${path}`));
      img.src = path;
    });
  }

  /**
   * 解析Spine数据
   */
  private parseSpineData(json: any, atlas: string, texture: HTMLImageElement): any {
    if (!this.spine) return null;

    try {
      const textureAtlas = new this.spine.TextureAtlas(atlas, {
        load: (page: any, path: string) => {
          page.setTexture(texture);
        }
      });

      const atlasAttachmentLoader = new this.spine.AtlasAttachmentLoader(textureAtlas);
      const skeletonJson = new this.spine.SkeletonJson(atlasAttachmentLoader);

      // 设置缩放比例
      if (this.spineOptions.scale) {
        skeletonJson.scale = this.spineOptions.scale;
      }

      return skeletonJson.readSkeletonData(json);
    } catch (error) {
      console.error('解析骨骼数据失败:', error);
      return null;
    }
  }

  /**
   * 初始化骨骼动画
   */
  private initSkeleton(): void {
    if (!this.skeletonData || !this.spine) return;

    // 创建骨骼和动画状态
    this.skeleton = new this.spine.Skeleton(this.skeletonData);
    this.state = new this.spine.AnimationState(this.spine.AnimationStateData.create(this.skeletonData));

    // 设置默认混合时间
    if (this.spineOptions.defaultMix) {
      this.state.data.defaultMix = this.spineOptions.defaultMix;
    }

    // 设置默认皮肤
    if (this.spineOptions.skin) {
      this.skeleton.setSkinByName(this.spineOptions.skin);
      this.skeleton.setSlotsToSetupPose();
    }

    // 设置默认动画
    if (this.spineOptions.defaultAnimation) {
      this.currentAnimation = this.spineOptions.defaultAnimation;
      this.state.setAnimation(0, this.currentAnimation, this.loop);
    }

    // 初始位置 - 居中
    this.skeleton.x = this.canvas.width / 2;
    this.skeleton.y = this.canvas.height;

    // 开始渲染循环
    this.lastTime = Date.now() / 1000;
    this.render();
  }

  /**
   * 更新动画
   */
  update(deltaTime: number): void {
    if (!this.isPlaying || !this.state) return;

    // 调整时间刻度
    deltaTime *= this.timeScale;

    // 更新Spine动画状态
    this.state.update(deltaTime);
    this.state.apply(this.skeleton);
    this.skeleton.updateWorldTransform();
  }

  /**
   * 渲染骨骼动画
   */
  render(): void {
    if (!this.skeleton) return;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    // 清除画布
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 计算时间差
    const now = Date.now() / 1000;
    const delta = now - this.lastTime;
    this.lastTime = now;

    // 更新动画
    if (this.isPlaying) {
      this.update(delta);
    }

    // 渲染骨骼
    // 实际实现应使用Spine运行时的渲染API
    // this.spine.draw(ctx, this.skeleton);

    // 调试模式 - 显示骨骼
    if (this.spineOptions.debug) {
      // this.spine.drawDebug(ctx, this.skeleton);
    }

    // 继续渲染循环
    this.animationRequestId = requestAnimationFrame(() => this.render());
  }

  /**
   * 播放动画
   * 实现AnimationInterface接口的play方法
   */
  play(stopAtBeginning?: boolean, idx?: number): void {
    if (!this.state) return;

    // 如果是动画名称（字符串类型），则直接使用
    if (typeof stopAtBeginning === 'string') {
      this.playAnimation(stopAtBeginning, this.loop);
      return;
    }

    // 保持原来的行为 - 从头开始播放当前动画
    const currentAnim = this.currentAnimation || this.spineOptions.defaultAnimation;
    if (currentAnim) {
      this.playAnimation(currentAnim, this.loop);
    } else {
      console.error('未指定动画名称');
    }
  }

  /**
   * 播放指定动画
   * 实现SpineAnimationInterface接口的playAnimation方法
   */
  playAnimation(animationName: string, loop?: boolean): void {
    if (!this.state) return;

    this.currentAnimation = animationName;
    // 确定是否循环
    const shouldLoop = loop !== undefined ? loop : this.loop;

    // 设置动画
    this.state.setAnimation(0, this.currentAnimation, shouldLoop);

    // 开始播放
    this.isPlaying = true;
    this.onPlay?.(this);
  }

  /**
   * 暂停动画
   */
  pause(): void {
    this.isPlaying = false;
    this.onPaused?.(this);
  }

  /**
   * 停止动画并重置
   */
  stop(): void {
    this.isPlaying = false;
    if (this.state && this.currentAnimation) {
      // 重置为第一帧
      this.state.setAnimation(0, this.currentAnimation, false);
      this.state.tracks[0].trackTime = 0;
    }
    this.onStop?.(this);
  }

  /**
   * 设置动画混合
   */
  setMix(fromName: string, toName: string, duration: number): void {
    if (this.state && this.state.data) {
      this.state.data.setMix(fromName, toName, duration);
    }
  }

  /**
   * 添加动画到队列
   */
  addAnimation(animationName: string, loop?: boolean, delay?: number): void {
    if (this.state) {
      this.state.addAnimation(0, animationName, loop !== undefined ? loop : this.loop, delay || 0);
    }
  }

  /**
   * 设置皮肤
   */
  setSkin(skinName: string): void {
    if (this.skeleton) {
      this.skeleton.setSkinByName(skinName);
      this.skeleton.setSlotsToSetupPose();
    }
  }

  /**
   * 获取所有可用的动画名称
   */
  getAnimations(): string[] {
    if (!this.skeletonData) return [];
    return this.skeletonData.animations.map((anim: any) => anim.name);
  }

  /**
   * 获取所有可用的皮肤
   */
  getSkins(): string[] {
    if (!this.skeletonData) return [];
    return this.skeletonData.skins.map((skin: any) => skin.name);
  }

  /**
   * 获取所有可用的插槽
   */
  getSlots(): string[] {
    if (!this.skeleton) return [];
    return this.skeleton.slots.map((slot: any) => slot.data.name);
  }

  /**
   * 恢复播放
   */
  resume(): void {
    this.isPlaying = true;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.stop();
    if (this.skeleton) {
      this.skeleton.setToSetupPose();
    }
  }

  /**
   * 设置显示指定索引的帧（为了兼容AnimationInterface）
   */
  setFrameByIndex(idx: number): void {
    console.warn('骨骼动画不支持通过索引设置帧，请使用play方法指定动画名称');
  }

  /**
   * 释放资源
   */
  destroy(): void {
    // 停止渲染循环
    if (this.animationRequestId) {
      cancelAnimationFrame(this.animationRequestId);
    }

    // 移除Canvas
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    // 清理资源引用
    this.skeleton = null;
    this.state = null;
    this.skeletonData = null;
    this.spine = null;
  }
}
