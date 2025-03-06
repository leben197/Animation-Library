import { Frame } from "../../../src/index";
import type { FrameOptions } from "../../../src/types";
// 图片路径数组 - 根据实际情况调整路径
const imagePaths = Array.from({ length: 43 }, (_, i) => `../../images/back/back${i}.webp`);
// const Sprite = ['../../images/0-24.png'];

// 动画配置
const options: FrameOptions = {
  frameWrap: document.getElementById("animation-container") as HTMLElement,
  imgs: imagePaths,
  width: 300,
  height: 400,
  // spriteSheet: {
  //   src: "../../images/0-24.png",
  //   frames: 25,
  //   frameWidth: 750,
  //   frameHeight: 1000,
  //   rows: 25,
  //   columns: 1,
  // },
  speed: 30,
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
