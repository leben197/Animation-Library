# **English** | [中文](https://github.com/1979044994/Animation-Library/blob/main/README.md)

# Animation Library [![GitHub stars](https://img.shields.io/github/stars/1979044994/Animation-Library.svg?style=social&label=Star)](https://github.com/1979044994/Animation-Library)

A simple and efficient JavaScript/TypeScript frame animation library that supports both Canvas and CSS3 rendering.

## Features

* 🚀 Supports two rendering modes: Canvas and CSS3
* 📦 Automatically selects the optimal rendering method
* 🎯 Supports pre - loading and progress callbacks
* 🖼️ Supports multiple sprite sheet modes (single long image and grid sprite sheets)
* 🔄 Optimized multi - image sequence animation without flickering
* ⚡ Hardware - accelerated image rendering
* 💪 Written in TypeScript with full type support

## Installation

```bash
npm install @leben/animation-library
pnpm add @leben/animation-library
yarn add @leben/animation-library
```

## Basic Usage

```typescript
import { Frame } from '@leben/animation-library';

const animation = new Frame({
  imgs: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
  frameWrap: '#animation-container', // Container selector or DOM element
  width: 500,                        // Width
  height: 300,                       // Height
  speed: 150,                        // Speed (milliseconds per frame)
  loop: true,                        // Whether to loop play
  autoPlay: true,                    // Whether to play automatically
});

// Control methods
animation.play();  // Play
animation.pause(); // Pause
animation.stop();  // Stop and reset
```

## Sprite Sheet Modes

### Horizontally Arranged Sprite Sheet

```typescript
const animation = new Frame({
  imgs: ['sprite-horizontal.png'], // Single horizontally arranged sprite sheet
  frameWrap: '#container',
  width: 200,
  height: 200,
  isSprite: true,                  // Enable sprite sheet mode
  framesNum: 8,                    // There are 8 frames in the sprite sheet
  spaceBetween: 0,                 // Spacing between frames (pixels)
  speed: 30,
  loop: true
});
```

### Grid - Arranged Sprite Sheet

It is recommended to use this method for all cases. For single - row and single - column sprite sheets, you can set rows or columns to 1.

```typescript
const animation = new Frame({
  frameWrap: '#container',
  width: 200,
  height: 200,
  spriteSheet: {
    src:'sprite-sheet.png',     // Path to the sprite sheet image
    frameWidth: 100,             // Width of each frame
    frameHeight: 100,            // Height of each frame
    frames: 16,                  // Total number of frames
    columns: 4,                  // Number of columns (optional)
    rows: 4                      // Number of rows (optional)
  },
  speed: 30,
  loop: true
});
```

## API Documentation

### Frame Class

#### Configuration Options

| Parameter    | Type                  | Default Value | Required | Description                                                       |
| ------------ | --------------------- | ------------- | -------- | ----------------------------------------------------------------- |
| imgs         | string[]              | -             | Yes*     | Array of image paths (*Not required when using spriteSheet)       |
| frameWrap    | string\HTMLElement    | -             | Yes      |                                                                   |
| width        | number                | -             | Yes      | Width of the animation                                            |
| height       | number                | -             | Yes      | Height of the animation                                           |
| speed        | number                | 30            | No       | Frame interval (ms)                                               |
| loop         | boolean               | true          | No       | Whether to play in a loop                                         |
| autoPlay     | boolean               | false         | No       | Whether to play automatically                                     |
| isSprite     | boolean               | false         | No       | Whether it is a horizontally arranged sprite sheet                |
| framesNum    | number                | 1             | No       | Number of frames in the sprite sheet (used when isSprite is true) |
| spaceBetween | number                | 0             | No       | Spacing between frames in the sprite sheet (pixels)               |
| spriteSheet  | SpriteSheetOptions    | -             | No       | Sprite sheet configuration (higher priority than isSprite)        |
| renderer     | 'canvas' 'css' 'auto' | ’‘          | No       | Rendering method                                                  |
| onReady      | () => void            | -             | No       | Callback when resources are loaded                                |
| onPlay       | (instance) => void    | -             | No       | Callback when playing starts                                      |
| onPaused     | (instance) => void    | -             | No       | Callback when paused                                              |
| onStop       | (instance) => void    | -             | No       | Callback when stopped                                             |
| onEnded      | (instance) => void    | -             | No       | Callback when non - loop play ends                                |

### SpriteSheet Options

| Parameter   | Type   | Default Value | Required | Description                    |
| ----------- | ------ | ------------- | -------- | ------------------------------ |
| src         | string | -             | Yes      | Path to the sprite sheet image |
| frameWidth  | number | -             | Yes      | Width of each frame (pixels)   |
| frameHeight | number | -             | Yes      | Height of each frame (pixels)  |
| frames      | number | -             | Yes      | Total number of frames         |
| columns     | number | 1             | No       | Number of columns              |
| rows        | number | 1             | No       | Number of rows                 |

#### Methods

* `play(stopAtBeginning?: boolean, idx?: number)`: Start playing. You can specify whether to start from the beginning and the starting frame.
* `pause()`: Pause playing
* `stop()`: Stop and reset to the first frame
* `setFrameByIndex(idx: number)`: Display the frame at the specified index

## Performance Optimization

The CSS3Animator uses a variety of optimization techniques to ensure smooth and flicker - free animations:

1. **Complete Pre - loading** : All images are pre - loaded before use to ensure browser caching.
2. **GPU Acceleration** : Use CSS optimization properties such as will - change and transform to utilize hardware acceleration.
3. **Rendering Optimization** : Avoid unnecessary repaints and only update the DOM when the image changes.
4. **Precise Frame Control** : Use requestAnimationFrame to ensure optimal performance and precise frame timing.
