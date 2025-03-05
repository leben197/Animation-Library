import { Frame } from "../../../src/index";
import type { FrameOptions } from "../../../src/types";

// 图片路径数组 - 根据实际情况调整路径
const imagePaths = [
  "./assets/frame1.png",
  "./assets/frame2.png",
  "./assets/frame3.png",
  "./assets/frame4.png",
  "./assets/frame5.png",
];

// 动画配置
const options: FrameOptions = {
  container: document.getElementById("animation-container") as HTMLElement,
  imgs: imagePaths,
  width: 500,
  height: 300,
  fps: 24,
  loop: true,
  autoPlay: false,
  onReady: () => {
    console.log("动画已准备就绪!");
    document.getElementById("play-btn")?.removeAttribute("disabled");
    document.getElementById("pause-btn")?.removeAttribute("disabled");
    document.getElementById("stop-btn")?.removeAttribute("disabled");
  }
};

// 初始化动画
const animation = new Frame(options);

// 设置按钮事件监听
document.getElementById("play-btn")?.addEventListener("click", () => {
  animation.play();
});

document.getElementById("pause-btn")?.addEventListener("click", () => {
  animation.pause();
});

document.getElementById("stop-btn")?.addEventListener("click", () => {
  animation.stop();
});

// 初始禁用按钮，直到动画准备就绪
document.getElementById("play-btn")?.setAttribute("disabled", "true");
document.getElementById("pause-btn")?.setAttribute("disabled", "true");
document.getElementById("stop-btn")?.setAttribute("disabled", "true");

console.log("动画加载中...");
