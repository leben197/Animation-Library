import { Frame } from "../../../src";
import type { FrameOptions } from "../../../src/types";

document.addEventListener('DOMContentLoaded', () => {
  // Spine骨骼动画配置
  const options: FrameOptions = {
    frameWrap: document.getElementById('spine-container') as HTMLElement,
    width: 400,
    height: 600,
    renderer: 'spine', // 指定使用Spine渲染器
    imgs: [], // 不需要指定图片，因为Spine使用自己的纹理格式
    spine: {
      // Spine资源路径
      jsonPath: './assets/spineboy/spineboy.json',
      atlasPath: './assets/spineboy/spineboy.atlas',
      texturePath: './assets/spineboy/spineboy.png',
      // 骨骼动画配置
      defaultAnimation: 'walk',
      loop: true,
      debug: true,  // 调试模式，显示骨骼
      scale: 0.5,   // 缩放比例
      skin: 'default'
    },
    autoPlay: false,
    onReady: () => {
      console.log('骨骼动画已加载完成');
      // 启用按钮
      document.querySelectorAll('.spine-btn').forEach(btn => {
        btn.removeAttribute('disabled');
      });

      // 显示可用的动画列表
      const spineAnimator = animation.getSpineAnimator();
      if (spineAnimator) {
        const animations = spineAnimator.getAnimations();
        const animationList = document.getElementById('animation-list');
        if (animationList) {
          animations.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            animationList.appendChild(option);
          });
        }

        // 显示可用的皮肤列表
        const skins = spineAnimator.getSkins();
        const skinList = document.getElementById('skin-list');
        if (skinList) {
          skins.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            skinList.appendChild(option);
          });
        }
      }
    }
  };

  // 创建动画实例
  const animation = new Frame(options);

  // 设置事件监听
  document.getElementById('play-btn')?.addEventListener('click', () => {
    const animationName = (document.getElementById('animation-list') as HTMLSelectElement).value;
    // 使用新的方法名
    animation.getSpineAnimator()?.playAnimation(animationName, true);
  });

  document.getElementById('pause-btn')?.addEventListener('click', () => {
    animation.pause();
  });

  document.getElementById('stop-btn')?.addEventListener('click', () => {
    animation.stop();
  });

  document.getElementById('skin-list')?.addEventListener('change', (e) => {
    const skinName = (e.target as HTMLSelectElement).value;
    animation.getSpineAnimator()?.setSkin(skinName);
  });

  // 初始禁用按钮，直到动画准备就绪
  document.querySelectorAll('.spine-btn').forEach(btn => {
    btn.setAttribute('disabled', 'true');
  });
});
