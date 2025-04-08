import { Frame } from "../../../src";
import type { FrameOptions } from "../../../src/types";

// 图片路径数组 - 根据实际情况调整路径
const getImagePath = (index: number) => `../../images/back/back${index}.webp`;
const imagePaths = Array.from({ length: 43 }, (_, i) => getImagePath(i));

// 动画配置
const options: FrameOptions = {
  frameWrap: document.getElementById("webgl-container") as HTMLElement,
  imgs: imagePaths,
  width: 325 * 0.6,
  height: 807 * 0.6,
  speed: 30,
  loop: true,
  renderer: "webgl", // 明确指定使用WebGL渲染
  autoPlay: false,
  onReady: () => {
    console.log("WebGL动画已准备就绪!");
    document.getElementById("play-btn")?.removeAttribute("disabled");
    document.getElementById("pause-btn")?.removeAttribute("disabled");
    document.getElementById("stop-btn")?.removeAttribute("disabled");

    // 更新状态显示
    document.getElementById("status")!.textContent = "状态: 就绪";
  },
  onProgress: (progress) => {
    const percent = Math.round(progress * 100);
    document.getElementById("progress-bar")!.style.width = `${percent}%`;
    document.getElementById("progress-text")!.textContent = `${percent}%`;
  }
};

// 初始化动画
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("status")!.textContent = "状态: 加载中...";

  // 添加性能监控
  const fpsDisplay = document.getElementById("fps-display")!;
  let frames = 0;
  let lastTime = performance.now();

  function updateFPS() {
    const now = performance.now();
    const elapsed = now - lastTime;

    if (elapsed >= 1000) {
      const fps = Math.round((frames * 1000) / elapsed);
      fpsDisplay.textContent = `FPS: ${fps}`;
      frames = 0;
      lastTime = now;
    }

    frames++;
    requestAnimationFrame(updateFPS);
  }

  updateFPS();

  const animation = new Frame(options);

  // 设置按钮事件监听
  document.getElementById("play-btn")?.addEventListener("click", () => {
    animation.play();
    document.getElementById("status")!.textContent = "状态: 播放中";
  });

  document.getElementById("pause-btn")?.addEventListener("click", () => {
    animation.pause();
    document.getElementById("status")!.textContent = "状态: 已暂停";
  });

  document.getElementById("stop-btn")?.addEventListener("click", () => {
    animation.stop();
    document.getElementById("status")!.textContent = "状态: 已停止";
  });

  // 初始禁用按钮，直到动画准备就绪
  document.getElementById("play-btn")?.setAttribute("disabled", "true");
  document.getElementById("pause-btn")?.setAttribute("disabled", "true");
  document.getElementById("stop-btn")?.setAttribute("disabled", "true");
});
