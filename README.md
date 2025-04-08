# **中文** | [English](https://github.com/1979044994/Animation-Library/blob/main/README.en-US.md)

# Animation Library [![GitHub stars](https://img.shields.io/github/stars/1979044994/Animation-Library.svg?style=social&label=Star)](https://github.com/1979044994/Animation-Library)

一个简单高效的JavaScript/TypeScript帧动画库，支持Canvas和CSS3渲染。

## 特性

* 🚀 支持Canvas和CSS3两种渲染模式
* 📦 自动选择最优渲染方式
* 🎯 支持预加载和进度回调
* 🖼️ 支持多种精灵图模式（单张长图和网格精灵表）
* 🔄 优化的无闪帧多图序列动画
* ⚡ 硬件加速图像渲染
* 💪 TypeScript编写，完整类型支持

## 安装

```bash
npm install @leben/animation-library
pnpm add @leben/animation-library
yarn add @leben/animation-library
```

## 基本用法

```typescript
import { Frame } from '@leben/animation-library';

const animation = new Frame({
  imgs: ['图片1.jpg', '图片2.jpg', '图片3.jpg'],
  frameWrap: '#animation-container', // 容器选择器或DOM元素
  width: 500,                        // 宽度
  height: 300,                       // 高度
  speed: 150,                        // 速度（毫秒/帧）
  loop: true,                        // 是否循环播放
  autoPlay: true,                    // 是否自动播放
});

// 控制方法
animation.play();  // 播放
animation.pause(); // 暂停
animation.stop();  // 停止并重置
```

## 精灵图模式

### 横向排列精灵图

```typescript
const animation = new Frame({
  imgs: ['sprite-horizontal.png'], // 单张水平排列的精灵图
  frameWrap: '#container',
  width: 200,
  height: 200,
  isSprite: true,                  // 启用精灵图模式
  framesNum: 8,                    // 精灵图中有8帧
  spaceBetween: 0,                 // 帧之间间距(像素)
  speed: 30,
  loop: true
});
```

### 网格排列精灵表

推荐全部使用这种方式，单行单列的精灵图可以将rows或者columns设置为1

```typescript
const animation = new Frame({
  frameWrap: '#container',
  width: 200,
  height: 200,
  spriteSheet: {
    src: 'sprite-sheet.png',     // 精灵表图片路径
    frameWidth: 100,             // 每帧宽度
    frameHeight: 100,            // 每帧高度
    frames: 16,                  // 总帧数
    columns: 4,                  // 列数（可选）
    rows: 4                      // 行数（可选）
  },
  speed: 30,
  loop: true
});
```

## 渲染模式

动画库支持多种渲染模式，可以根据需求选择:

1. **CSS3渲染器** (`renderer: 'css'`) - 使用CSS3动画，低CPU占用，适合简单动画
2. **Canvas渲染器** (`renderer: 'canvas'`) - 使用Canvas 2D API，兼容性好，适合中等复杂度动画
3. **WebGL渲染器** (`renderer: 'webgl'`) - 使用GPU加速，性能最佳，适合复杂动画和视觉效果
4. **Spine骨骼动画** (`renderer: 'spine'`) - 支持Spine骨骼动画格式
5. **自动选择** (`renderer: 'auto'` 或不指定) - 根据浏览器支持自动选择最佳渲染器

```typescript
// WebGL渲染示例
const animation = new Frame({
  frameWrap: '#container',
  imgs: ['frame1.png', 'frame2.png', '...'],
  width: 300,
  height: 300,
  renderer: 'webgl',   // 指定使用WebGL渲染
  speed: 30,
  loop: true
});
```

## API文档

### Frame类

#### 配置选项

| 参数         | 类型                  | 默认值 | 是否必填 | 说明                                     |
| ------------ | --------------------- | ------ | -------- | ---------------------------------------- |
| imgs         | string[]              | -      | 是*      | 图片路径数组（*使用spriteSheet时可不填） |
| frameWrap    | string\HTMLElement    |        | 是       |                                          |
| width        | number                | -      | 是       | 动画宽度                                 |
| height       | number                | -      | 是       | 动画高度                                 |
| speed        | number                | 30     | 否       | 帧间隔(ms)                               |
| loop         | boolean               | true   | 否       | 是否循环播放                             |
| autoPlay     | boolean               | false  | 否       | 是否自动播放                             |
| isSprite     | boolean               | false  | 否       | 是否为水平排列的精灵图                   |
| framesNum    | number                | 1      | 否       | 精灵图中的帧数（isSprite为true时使用）   |
| spaceBetween | number                | 0      | 否       | 精灵图中帧间距(像素)                     |
| spriteSheet  | SpriteSheetOptions    | -      | 否       | 精灵表配置（优先级高于isSprite）         |
| renderer     | 'canvas' 'css' 'auto' | ’‘   | 否       | 渲染方式                                 |
| onReady      | () => void            | -      | 否       | 资源加载完成回调                         |
| onPlay       | (instance) => void    | -      | 否       | 播放开始回调                             |
| onPaused     | (instance) => void    | -      | 否       | 暂停回调                                 |
| onStop       | (instance) => void    | -      | 否       | 停止回调                                 |
| onEnded      | (instance) => void    | -      | 否       | 非循环播放结束回调                       |

### SpriteSheet选项

| 参数        | 类型   | 默认值 | 是否必填 | 说明           |
| ----------- | ------ | ------ | -------- | -------------- |
| src         | string | -      | 是       | 精灵表图片路径 |
| frameWidth  | number | -      | 是       | 每帧宽度(像素) |
| frameHeight | number | -      | 是       | 每帧高度(像素) |
| frames      | number | -      | 是       | 总帧数         |
| columns     | number | 1      | 否       | 列数           |
| rows        | number | 1      | 否       | 行数           |

#### 方法

* `play(stopAtBeginning?: boolean, idx?: number)`: 开始播放，可指定是否从头开始及起始帧
* `pause()`: 暂停播放
* `stop()`: 停止并重置到第一帧
* `setFrameByIndex(idx: number)`: 显示指定索引的帧

## 性能优化

CSS3Animator采用了多种优化技术确保动画平滑无闪烁：

1. **完整预加载** ：所有图像在使用前都会进行预加载，确保浏览器缓存
2. **GPU加速** ：使用CSS优化属性如will-change和transform，利用硬件加速
3. **渲染优化** ：避免不必要的重绘，仅在图像发生变化时更新DOM
4. **精确帧控制** ：使用requestAnimationFrame确保最佳性能和精确的帧定时

### 高级性能选项

库提供了多种高级性能优化选项：

```typescript
const animation = new Frame({
  // ...基本配置...

  // 性能优化配置
  performance: {
    useFrameCache: true,     // 启用帧缓存以避免重复渲染
    useOffscreen: true,      // 使用离屏Canvas渲染
    maxCacheFrames: 50       // 最大缓存帧数量
  },

  // Web Worker配置（仅Canvas渲染器）
  workerOptions: {
    enabled: true,                      // 启用Web Worker
    workerPath: './custom-worker.js'    // 可选：自定义Worker脚本路径
  }
});
```

### Web Worker 支持

对于计算密集型的动画，库已支持通过Web Worker将渲染工作放到独立线程，避免阻塞主线程，特别适合:

- 大尺寸Canvas渲染
- 高帧率动画
- 需要实时滤镜或效果的动画

使用Worker时，确保在您的构建配置中正确处理Worker文件的打包。您需要确保 `render-worker.js`正确打包到您的最终输出目录。

## 其他配置选项

除了基础选项外，库还支持以下高级配置：

| 参数          | 类型                     | 默认值 | 说明                                 |
| ------------- | ------------------------ | ------ | ------------------------------------ |
| onProgress    | (progress: number)=>void | -      | 加载进度回调（0-1之间的数值）        |
| performance   | Object                   | -      | 性能优化选项（仅Canvas渲染器有效）   |
| workerOptions | Object                   | -      | Web Worker配置（仅Canvas渲染器有效） |

## 示例
