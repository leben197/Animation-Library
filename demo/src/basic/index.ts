import { Frame } from "../../../src/index";
import type { FrameOptions } from "../../../src/types";
// 图片路径数组 - 根据实际情况调整路径
const imagePaths = [
  "../../images/back/back0.webp",
  "../../images/back/back1.webp",
  "../../images/back/back2.webp",
  "../../images/back/back3.webp",
  "../../images/back/back4.webp",
  "../../images/back/back5.webp",
  "../../images/back/back6.webp",
  "../../images/back/back7.webp",
  "../../images/back/back8.webp",
  "../../images/back/back9.webp",
  "../../images/back/back10.webp",
  "../../images/back/back11.webp",
  "../../images/back/back12.webp",
  "../../images/back/back13.webp",
  "../../images/back/back14.webp",
  "../../images/back/back15.webp",
  "../../images/back/back16.webp",
  "../../images/back/back17.webp",
  "../../images/back/back18.webp",
  "../../images/back/back19.webp",
];

// 动画配置
const options: FrameOptions = {
  frameWrap: document.getElementById("animation-container") as HTMLElement,
  imgs: imagePaths,
  width: 500,
  height: 300,
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
