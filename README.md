# Animation Library

一个简单高效的JavaScript/TypeScript帧动画库，支持Canvas和CSS3渲染。

## 特性

- 🚀 支持Canvas和CSS3两种渲染模式
- 📦 自动选择最优渲染方式
- 🎯 支持预加载和进度回调
- 💪 TypeScript编写，完整类型支持

## 安装

```bash
npm install @leben/animation-library
pnpm add @leben/animation-library
yarn add @leben/animation-library
```

## 基本用法

```typescript
import { Frame } from 'animation-library';

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

## API文档

### Frame类

#### 配置选项

| 参数      | 类型                 | 默认值 | 说明             |
| --------- | -------------------- | ------ | ---------------- |
| imgs      | string[]             | -      | 图片路径数组     |
| frameWrap | string\| HTMLElement | -      | 容器元素或选择器 |
| width     | number               | -      | 动画宽度         |
| height    | number               | -      | 动画高度         |
| speed     | number               | 100    | 帧间隔(ms)       |
| loop      | boolean              | true   | 是否循环播放     |

#### 方法

-`play()`: 开始播放

-`pause()`: 暂停播放

-`stop()`: 停止并重置

## 示例
