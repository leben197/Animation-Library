import { Frame } from "../../../src/index";
import type { FrameOptions } from "../../../src/types";

// 图片路径数组 - 使用高分辨率或大量图像更能体现Worker的优势

const imagePaths = Array.from({ length: 43 }, (_, i) => {
  try {
    // 使用Vite的资源导入方式
    // 注意：路径是相对于当前文件位置的
    return new URL(`../../images/back/back${i}.webp`, import.meta.url).href;
  } catch (error) {
    console.error(`Failed to load frame ${i}:`, error);
    return ''; // 返回空字符串，后续可以过滤掉
  }
}).filter(url => url); // 过滤掉任何空URL
// 创建性能测试函数
const measurePerformance = (name: string) => {
  const stats = {
    frames: 0,
    startTime: performance.now(),
    lastTime: performance.now(),
    fps: 0,
    averageFps: 0,
    minFps: Infinity,
    maxFps: 0,
    fpsHistory: [] as number[]
  };

  // FPS计算和显示函数
  const updateStats = () => {
    const now = performance.now();
    const elapsed = now - stats.lastTime;

    if (elapsed >= 1000) { // 每秒更新一次
      stats.fps = Math.round(stats.frames * 1000 / elapsed);
      stats.fpsHistory.push(stats.fps);

      // 更新最小和最大FPS
      stats.minFps = Math.min(stats.minFps, stats.fps);
      stats.maxFps = Math.max(stats.maxFps, stats.fps);

      // 计算平均FPS
      const sum = stats.fpsHistory.reduce((a, b) => a + b, 0);
      stats.averageFps = Math.round(sum / stats.fpsHistory.length);

      // 更新UI显示
      const statsElement = document.getElementById(`${name}-stats`);
      if (statsElement) {
        statsElement.innerHTML =
          `FPS: ${stats.fps} | 平均: ${stats.averageFps} | 最低: ${stats.minFps} | 最高: ${stats.maxFps}`;
      }

      // 重置计数器
      stats.frames = 0;
      stats.lastTime = now;
    }

    stats.frames++;
    requestAnimationFrame(updateStats);
  };

  // 启动性能监测
  updateStats();

  return stats;
};

// 模拟主线程工作负载 - 会导致UI线程变慢
function simulateHeavyMainThreadWork(intensity = 1) {
  // 创建对主线程的压力
  document.getElementById('cpu-stress')!.textContent = '主线程压力模拟中...';

  // 计算密集型操作
  const loop = () => {
    const start = performance.now();

    // 根据强度执行不同级别的计算 - 这将真正阻塞主线程
    if (intensity > 0) {
      // 增强计算量，创造更明显的压力
      for (let j = 0; j < intensity * 2; j++) {
        // 创建大量数据并进行操作
        const data = new Array(40000).fill(0).map(() => Math.random());
        const sorted = [...data].sort();
        const sum = data.reduce((a, b) => a + b, 0);

        // 强制布局重排，让主线程更加繁忙
        document.body.offsetHeight;
      }

      // DOM操作产生更多压力
      const display = document.getElementById('stress-result');
      if (display) {
        display.innerHTML = `计算中...<span style="color:red">强度: ${intensity}</span>`;
      }
    }

    // 持续执行工作
    if ((document.getElementById('stress-toggle') as HTMLInputElement)!.checked) {
      requestAnimationFrame(loop);
    } else {
      document.getElementById('cpu-stress')!.textContent = '主线程压力模拟已关闭';
    }
  };

  // 开始循环
  requestAnimationFrame(loop);
}

// 添加图像处理效果
function applyImageEffects(canvas: HTMLCanvasElement, intensity = 1) {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("无法获取 canvas 上下文");
      return;
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 根据强度应用不同效果
    for (let i = 0; i < data.length; i += 4) {
      // 复杂的像素处理
      if (intensity >= 1) {
        // 应用模糊效果 (非常消耗性能)
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i] * 0.7 + avg * 0.3;
        data[i + 1] = data[i + 1] * 0.7 + avg * 0.3;
        data[i + 2] = data[i + 2] * 0.7 + avg * 0.3;
      }

      if (intensity >= 2) {
        // 更复杂的效果
        data[i] = 255 - data[i];      // 反相效果
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }

    // 应用修改后的图像数据
    ctx.putImageData(imageData, 0, 0);
  } catch (e) {
    console.error("Error applying effects:", e);
  }
}

// 创建两个动画实例用于比较
document.addEventListener("DOMContentLoaded", () => {
  // 强度滑块事件监听
  document.getElementById('effect-intensity')!.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    document.getElementById('intensity-value')!.textContent = value.toString();
  });

  // 压力测试开关事件监听
  document.getElementById('stress-toggle')!.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).checked) {
      const intensity = parseInt((document.getElementById('effect-intensity') as HTMLInputElement).value);
      // 提示用户
      alert(`即将开始主线程压力测试，强度为${intensity}。这将使界面变得卡顿。点击确定开始测试。`);
      simulateHeavyMainThreadWork(intensity);
    } else {
      document.getElementById('cpu-stress')!.textContent = '主线程压力模拟已关闭';
    }
  });

  // 1. 不使用Worker的动画实例
  const regularOptions: FrameOptions = {
    frameWrap: document.getElementById("regular-container") as HTMLElement,
    imgs: imagePaths,
    width: 325 * 0.6,
    height: 807 * 0.6,
    speed: 30,
    loop: true,
    renderer: "canvas", // 强制使用Canvas渲染器
    autoPlay: false,
    onReady: () => {
      console.log("常规动画已准备就绪!");
      document.getElementById("regular-play-btn")?.removeAttribute("disabled");
      document.getElementById("regular-pause-btn")?.removeAttribute("disabled");
      document.getElementById("regular-stop-btn")?.removeAttribute("disabled");

      // 记录加载完成时间
      const loadTime = performance.now() - startTime;
      document.getElementById("regular-loading")!.textContent = `加载完成 (${loadTime.toFixed(0)}ms)`;
    },
    onProgress: (progress) => {
      document.getElementById("regular-progress")!.style.width = `${progress * 100}%`;
    },
    // 不使用Worker
    performance: {
      useFrameCache: true,  // 启用帧缓存
      useOffscreen: true    // 使用离屏Canvas
    }
  };

  // 2. 使用Worker的动画实例
  const workerOptions: FrameOptions = {
    frameWrap: document.getElementById("worker-container") as HTMLElement,
    imgs: imagePaths,
    width: 325 * 0.6,
    height: 807 * 0.6,
    speed: 30,
    loop: true,
    renderer: "canvas", // 强制使用Canvas渲染器
    autoPlay: false,
    onReady: () => {
      console.log("Worker动画已准备就绪!");
      document.getElementById("worker-play-btn")?.removeAttribute("disabled");
      document.getElementById("worker-pause-btn")?.removeAttribute("disabled");
      document.getElementById("worker-stop-btn")?.removeAttribute("disabled");

      // 记录加载完成时间
      const loadTime = performance.now() - startTime;
      document.getElementById("worker-loading")!.textContent = `加载完成 (${loadTime.toFixed(0)}ms)`;
    },
    onProgress: (progress) => {
      document.getElementById("worker-progress")!.style.width = `${progress * 100}%`;
    },
    // 启用Worker并使用正确的路径策略
    workerOptions: {
      enabled: true
      // 不指定workerPath，使用内联模式
    },
    performance: {
      useFrameCache: true,  // 启用帧缓存
      useOffscreen: true    // 使用离屏Canvas
    }
  };

  // 记录开始时间
  const startTime = performance.now();
  document.getElementById("regular-loading")!.textContent = "加载中...";
  document.getElementById("worker-loading")!.textContent = "加载中...";

  // 创建动画实例
  const regularAnimation = new Frame(regularOptions);
  const workerAnimation = new Frame(workerOptions);

  // 设置按钮事件监听 - 常规动画
  document.getElementById("regular-play-btn")?.addEventListener("click", () => {
    regularAnimation.play();
    // 开始性能测量
    measurePerformance("regular");

    // 对主线程版本的动画进行额外处理，增加计算负担
    const canvas = document.querySelector("#regular-container canvas") as HTMLCanvasElement;
    if (canvas) {
      const intensity = parseInt((document.getElementById('effect-intensity') as HTMLInputElement).value);
      // 在每一帧添加高计算量的图像处理
      const processFrame = () => {
        if (!(document.getElementById("regular-play-btn") as HTMLButtonElement)?.disabled) {
          applyImageEffects(canvas, intensity);
          requestAnimationFrame(processFrame);
        }
      };
      processFrame();
    }
  });

  document.getElementById("regular-pause-btn")?.addEventListener("click", () => {
    regularAnimation.pause();
  });

  document.getElementById("regular-stop-btn")?.addEventListener("click", () => {
    regularAnimation.stop();
  });

  // 设置按钮事件监听 - Worker动画
  document.getElementById("worker-play-btn")?.addEventListener("click", () => {
    workerAnimation.play();
    // 开始性能测量
    measurePerformance("worker");
  });

  document.getElementById("worker-pause-btn")?.addEventListener("click", () => {
    workerAnimation.pause();
  });

  document.getElementById("worker-stop-btn")?.addEventListener("click", () => {
    workerAnimation.stop();
  });

  // 初始禁用按钮，直到动画准备就绪
  ["regular", "worker"].forEach(prefix => {
    document.getElementById(`${prefix}-play-btn`)?.setAttribute("disabled", "true");
    document.getElementById(`${prefix}-pause-btn`)?.setAttribute("disabled", "true");
    document.getElementById(`${prefix}-stop-btn`)?.setAttribute("disabled", "true");
  });

  // 添加UI互动性测试按钮
  document.getElementById("ui-test-btn")?.addEventListener("click", () => {
    const count = 200;
    const resultDiv = document.getElementById("ui-test-result")!;

    resultDiv.innerHTML = "测试UI响应性...";
    const startTime = performance.now();

    // 创建大量DOM元素 - 这将测试主线程的响应能力
    setTimeout(() => {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const div = document.createElement("div");
        div.className = "test-box";
        div.textContent = `#${i}`;
        div.style.backgroundColor = `hsl(${i * 360 / count}, 70%, 60%)`;
        fragment.appendChild(div);
      }

      resultDiv.innerHTML = "";
      resultDiv.appendChild(fragment);

      const endTime = performance.now();
      document.getElementById("ui-response-time")!.textContent =
        `UI响应耗时: ${(endTime - startTime).toFixed(1)}ms`;
    }, 100);
  });

  // 添加页面性能监控
  const updatePagePerformance = () => {
    const now = performance.now();
    const fpsSample = document.getElementById('page-fps');
    if (fpsSample) {
      // 计算大致的页面FPS
      const fps = Math.round(1000 / (now - (window as any)._lastFrame || now));
      fpsSample.textContent = `页面响应: ${fps} FPS`;
      fpsSample.style.color = fps > 30 ? 'green' : (fps > 15 ? 'orange' : 'red');
    }
    (window as any)._lastFrame = now;
    requestAnimationFrame(updatePagePerformance);
  };
  updatePagePerformance();
});
