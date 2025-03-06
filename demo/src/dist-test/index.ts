import type { FrameOptions } from '@leben/animation-library';
import { Frame } from '@leben/animation-library';


// 图片路径
const spriteImgPath = '../../images/0-24.png';
const sequenceImgPaths = Array.from({ length: 42 }, (_, i) => `../../images/back/back${i}.webp`);

// ======== Canvas精灵图动画 ========
const canvasOptions: FrameOptions = {
  frameWrap: document.getElementById("canvas-container") as HTMLElement,
  imgs: [spriteImgPath],
  width: 440,
  height: 400,
  speed: 40,
  spriteSheet: {
    src: spriteImgPath,
    frames: 25,
    frameWidth: 1100,
    frameHeight: 1000,
    rows: 25,
    columns: 1,
  },
  loop: true,
  autoPlay: false,
  renderer: 'canvas',
  onReady: () => {
    console.log("Canvas动画已准备就绪!");
    document.getElementById("canvas-play")?.removeAttribute("disabled");
    document.getElementById("canvas-pause")?.removeAttribute("disabled");
    document.getElementById("canvas-stop")?.removeAttribute("disabled");
  }
};

const canvasAnimation = new Frame(canvasOptions);

// ======== CSS3精灵图动画 ========
const css3Options: FrameOptions = {
  frameWrap: document.getElementById("css3-container") as HTMLElement,
  imgs: [spriteImgPath],
  width: 440,
  height: 400,
  speed: 40,
  spriteSheet: {
    src: spriteImgPath,
    frames: 25,
    frameWidth: 1100,
    frameHeight: 1000,
    rows: 25,
    columns: 1,
  },
  loop: true,
  autoPlay: false,
  renderer: 'css3',
  onReady: () => {
    console.log("CSS3动画已准备就绪!");
    document.getElementById("css3-play")?.removeAttribute("disabled");
    document.getElementById("css3-pause")?.removeAttribute("disabled");
    document.getElementById("css3-stop")?.removeAttribute("disabled");
  }
};

const css3Animation = new Frame(css3Options);

// ======== 多图序列动画 ========
const sequenceOptions: FrameOptions = {
  frameWrap: document.getElementById("sequence-container") as HTMLElement,
  imgs: sequenceImgPaths,
  width: 440,
  height: 400,
  speed: 24,
  loop: true,
  autoPlay: false,
  renderer: 'css', // 也可以使用'canvas'
  onReady: () => {
    console.log("序列帧动画已准备就绪!");
    document.getElementById("sequence-play")?.removeAttribute("disabled");
    document.getElementById("sequence-pause")?.removeAttribute("disabled");
    document.getElementById("sequence-stop")?.removeAttribute("disabled");
  }
};

const sequenceAnimation = new Frame(sequenceOptions);

// ======== 绑定按钮事件 ========
// Canvas控制
document.getElementById("canvas-play")?.addEventListener("click", () => {
  canvasAnimation.play();
});

document.getElementById("canvas-pause")?.addEventListener("click", () => {
  canvasAnimation.pause();
});

document.getElementById("canvas-stop")?.addEventListener("click", () => {
  canvasAnimation.stop();
});

// CSS3控制
document.getElementById("css3-play")?.addEventListener("click", () => {
  css3Animation.play();
});

document.getElementById("css3-pause")?.addEventListener("click", () => {
  css3Animation.pause();
});

document.getElementById("css3-stop")?.addEventListener("click", () => {
  css3Animation.stop();
});

// 序列帧控制
document.getElementById("sequence-play")?.addEventListener("click", () => {
  sequenceAnimation.play();
});

document.getElementById("sequence-pause")?.addEventListener("click", () => {
  sequenceAnimation.pause();
});

document.getElementById("sequence-stop")?.addEventListener("click", () => {
  sequenceAnimation.stop();
});

// 初始禁用按钮
const buttons = document.querySelectorAll("button");
buttons.forEach(button => {
  button.setAttribute("disabled", "true");
});
