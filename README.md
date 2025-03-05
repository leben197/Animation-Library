
# Animation Library

一个简单高效的JavaScript/TypeScript帧动画库，支持Canvas和CSS3渲染。

## 安装

```bash
npm install animation-library
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

## 更多文档

查看完整文档和示例代码...
