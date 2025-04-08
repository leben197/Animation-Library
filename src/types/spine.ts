/**
 * Spine骨骼动画配置选项
 */
export interface SpineOptions {
  /** 骨骼数据JSON文件路径 */
  jsonPath: string;
  /** 纹理集(atlas)文件路径 */
  atlasPath: string;
  /** 纹理图像路径(或自动从atlas推导) */
  texturePath?: string;
  /** 默认动画名称 */
  defaultAnimation?: string;
  /** 动画的混合时间(秒) */
  defaultMix?: number;
  /** 动画播放速度 */
  timeScale?: number;
  /** 是否循环默认动画 */
  loop?: boolean;
  /** 调试模式(显示骨骼) */
  debug?: boolean;
  /** 骨骼缩放比例 */
  scale?: number;
  /** 皮肤名称 */
  skin?: string;
}

/**
 * 骨骼动画接口
 */
export interface SpineAnimationInterface {
  /**
   * 播放指定动画
   * 重命名为playAnimation以避免与AnimationInterface冲突
   */
  playAnimation(animationName: string, loop?: boolean): void;
  /** 设置动画混合 */
  setMix(fromName: string, toName: string, duration: number): void;
  /** 添加动画到队列 */
  addAnimation(animationName: string, loop?: boolean, delay?: number): void;
  /** 设置皮肤 */
  setSkin(skinName: string): void;
  /** 获取所有可用的动画名称 */
  getAnimations(): string[];
  /** 获取所有可用的皮肤 */
  getSkins(): string[];
  /** 获取所有可用的插槽 */
  getSlots(): string[];
  /** 更新动画 */
  update(delta: number): void;
  /** 渲染 */
  render(): void;
  /** 暂停 */
  pause(): void;
  /** 恢复 */
  resume(): void;
  /** 重置 */
  reset(): void;
}
