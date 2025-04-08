import { BaseAnimator } from "./BaseAnimator";
import { FrameOptions } from "./types";

/**
 * WebGL动画渲染器
 * 使用WebGL进行高性能渲染
 */
export class WebGLAnimator extends BaseAnimator {
  /** Canvas元素 */
  private canvas: HTMLCanvasElement;
  /** WebGL上下文 */
  private gl: WebGLRenderingContext;
  /** 着色器程序 */
  private shaderProgram: WebGLProgram | null = null;
  /** 顶点缓冲区 */
  private vertexBuffer: WebGLBuffer | null = null;
  /** 纹理坐标缓冲区 */
  private texCoordBuffer: WebGLBuffer | null = null;
  /** 纹理对象 */
  private textures: WebGLTexture[] = [];
  /** 当前纹理 */
  private currentTexture: WebGLTexture | null = null;
  /** 顶点着色器源码 */
  private readonly vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    varying highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;
  /** 片段着色器源码 */
  private readonly fsSource = `
    precision mediump float;
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

  constructor(options: FrameOptions, images: HTMLImageElement[]) {
    super(options, images);

    // 创建Canvas元素
    this.canvas = document.createElement('canvas');
    this.canvas.width = options.width;
    this.canvas.height = options.height;
    this.canvas.style.width = `${options.width}px`;
    this.canvas.style.height = `${options.height}px`;

    // 获取WebGL上下文
    const gl = this.canvas.getContext('webgl', {
      premultipliedAlpha: true,
      alpha: true
    });

    if (!gl) {
      throw new Error('无法初始化WebGL，您的浏览器可能不支持');
    }
    this.gl = gl;

    // 将Canvas添加到容器
    const container = typeof options.frameWrap === 'string'
      ? document.querySelector(options.frameWrap)
      : options.frameWrap;

    if (!container) {
      throw new Error('找不到动画容器');
    }

    container.appendChild(this.canvas);

    // 初始化WebGL
    this.initWebGL();

    // 加载所有图像作为纹理
    this.loadTextures(images);

    // 显示第一帧
    this.setFrameByIndex(0);
  }

  // 实现抽象方法
  protected startAnimationLoop(): void {
    this.animateWithRequestAnimationFrame();
  }

  // 实现抽象方法
  protected renderFrame(): void {
    this.drawCurrentFrame();
  }

  /**
   * 初始化WebGL
   */
  private initWebGL(): void {
    // 初始化着色器
    this.initShaderProgram();

    // 初始化几何图形
    this.initBuffers();

    // 设置WebGL渲染参数
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  }

  /**
   * 初始化着色器程序
   */
  private initShaderProgram(): void {
    const gl = this.gl;

    // 创建着色器
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, this.vsSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, this.fsSource);

    // 创建着色器程序
    const shaderProgram = gl.createProgram();
    if (!shaderProgram || !vertexShader || !fragmentShader) {
      throw new Error('创建着色器程序失败');
    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // 检查链接是否成功
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw new Error(`无法初始化着色器程序: ${gl.getProgramInfoLog(shaderProgram)}`);
    }

    this.shaderProgram = shaderProgram;

    // 使用着色器程序
    gl.useProgram(this.shaderProgram);
  }

  /**
   * 加载着色器
   */
  private loadShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type);

    if (!shader) {
      console.error('创建着色器失败');
      return null;
    }

    // 将源码添加到着色器
    gl.shaderSource(shader, source);

    // 编译着色器
    gl.compileShader(shader);

    // 检查编译是否成功
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`着色器编译错误: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * 初始化缓冲区
   */
  private initBuffers(): void {
    const gl = this.gl;

    // 创建顶点位置缓冲区
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    // 全屏四边形的顶点坐标
    const vertices = [
      -1.0, -1.0,  // 左下
      1.0, -1.0,  // 右下
      -1.0, 1.0,  // 左上
      1.0, 1.0,  // 右上
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // 创建纹理坐标缓冲区
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);

    // 纹理坐标
    const textureCoords = [
      0.0, 1.0,  // 左下
      1.0, 1.0,  // 右下
      0.0, 0.0,  // 左上
      1.0, 0.0,  // 右上
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  }

  /**
   * 计算精灵表的纹理坐标
   */
  private calculateSpriteSheetTexCoords(frameIndex: number): Float32Array {
    if (!this.spriteSheet) {
      return new Float32Array([
        0.0, 1.0,  // 左下
        1.0, 1.0,  // 右下
        0.0, 0.0,  // 左上
        1.0, 0.0,  // 右上
      ]);
    }

    const { frameWidth, frameHeight, columns = 1, rows = 1 } = this.spriteSheet;

    // 计算帧在精灵表中的位置
    let row, col;
    if (columns === 1) {
      row = frameIndex;
      col = 0;
    } else if (rows === 1) {
      row = 0;
      col = frameIndex;
    } else {
      row = Math.floor(frameIndex / columns);
      col = frameIndex % columns;
    }

    // 获取第一张图像作为精灵表
    const spriteImg = this.images[0];
    if (!spriteImg) return new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

    // 计算在整个纹理中的比例坐标
    const left = col * frameWidth / spriteImg.width;
    const right = (col + 1) * frameWidth / spriteImg.width;
    const top = row * frameHeight / spriteImg.height;
    const bottom = (row + 1) * frameHeight / spriteImg.height;

    return new Float32Array([
      left, bottom,   // 左下
      right, bottom,  // 右下
      left, top,      // 左上
      right, top      // 右上
    ]);
  }

  /**
   * 计算精灵图的纹理坐标
   */
  private calculateSpriteTexCoords(frameIndex: number): Float32Array {
    if (!this.isSprite || !this.images[0]) {
      return new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    }

    const spriteImg = this.images[0];
    let left, right, top, bottom;

    if (this.isVertical) {
      const frameHeight = spriteImg.height / this.framesNum;
      const spacingRatio = this.spaceBetween / spriteImg.height;

      top = frameIndex * (frameHeight / spriteImg.height + spacingRatio);
      bottom = top + frameHeight / spriteImg.height;
      left = 0;
      right = 1;
    } else {
      const frameWidth = spriteImg.width / this.framesNum;
      const spacingRatio = this.spaceBetween / spriteImg.width;

      left = frameIndex * (frameWidth / spriteImg.width + spacingRatio);
      right = left + frameWidth / spriteImg.width;
      top = 0;
      bottom = 1;
    }

    return new Float32Array([
      left, bottom,
      right, bottom,
      left, top,
      right, top
    ]);
  }

  /**
   * 设置当前帧的纹理坐标
   */
  private setCurrentFrameTexCoords(): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);

    let texCoords: Float32Array;

    if (this.spriteSheet && this.images[0]) {
      texCoords = this.calculateSpriteSheetTexCoords(this.currentFrame);
    } else if (this.isSprite && this.images[0]) {
      texCoords = this.calculateSpriteTexCoords(this.currentFrame);
    } else {
      // 序列帧模式使用整个纹理
      texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    }

    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  }

  /**
   * 加载纹理
   */
  private loadTextures(images: HTMLImageElement[]): void {
    const gl = this.gl;

    // 清空现有纹理
    this.textures = [];

    // 对于精灵图或精灵表模式，只需要第一张图像作为纹理
    if (this.isSprite || this.spriteSheet) {
      if (images[0]) {
        const texture = this.createTextureFromImage(images[0]);
        if (texture) {
          this.textures.push(texture);
        }
      }
    } else {
      // 序列帧模式，每张图像都需要作为纹理
      for (const img of images) {
        const texture = this.createTextureFromImage(img);
        if (texture) {
          this.textures.push(texture);
        }
      }
    }

    // 如果有纹理，设置第一个作为当前纹理
    if (this.textures.length > 0) {
      this.currentTexture = this.textures[0];
    }
  }

  /**
   * 从图像创建WebGL纹理
   */
  private createTextureFromImage(image: HTMLImageElement): WebGLTexture | null {
    const gl = this.gl;
    const texture = gl.createTexture();

    if (!texture) return null;

    // 通过将每个图像绑定到GL_TEXTURE_2D来启用纹理
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 上传图像到纹理
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
  }

  /**
   * 绘制当前帧
   */
  private drawCurrentFrame(): void {
    const gl = this.gl;

    // 设置视口
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!this.shaderProgram) return;

    // 使用着色器程序
    gl.useProgram(this.shaderProgram);

    // 绑定纹理
    let currentTexture: WebGLTexture | null = null;

    if (this.isSprite || this.spriteSheet) {
      // 精灵图或精灵表模式只使用第一个纹理
      if (this.textures.length > 0) {
        currentTexture = this.textures[0];
      }
      this.setCurrentFrameTexCoords();
    } else {
      // 序列帧模式每帧使用不同的纹理
      if (this.textures.length > this.currentFrame) {
        currentTexture = this.textures[this.currentFrame];
      }
    }

    if (!currentTexture) return;

    // 获取shader属性位置
    const vertexPosition = gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    const textureCoord = gl.getAttribLocation(this.shaderProgram, 'aTextureCoord');
    const uSampler = gl.getUniformLocation(this.shaderProgram, 'uSampler');

    // 设置顶点位置
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);

    // 设置纹理坐标
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textureCoord);

    // 绑定纹理到纹理单元
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currentTexture);
    gl.uniform1i(uSampler, 0);

    // 绘制
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * 设置显示指定索引的帧
   */
  setFrameByIndex(idx: number): void {
    super.setFrameByIndex(idx);
    this.drawCurrentFrame();
  }

  /**
   * 释放资源
   */
  destroy(): void {
    const gl = this.gl;

    // 删除着色器程序
    if (this.shaderProgram) {
      gl.deleteProgram(this.shaderProgram);
    }

    // 删除缓冲区
    if (this.vertexBuffer) {
      gl.deleteBuffer(this.vertexBuffer);
    }
    if (this.texCoordBuffer) {
      gl.deleteBuffer(this.texCoordBuffer);
    }

    // 删除纹理
    for (const texture of this.textures) {
      gl.deleteTexture(texture);
    }

    // 移除canvas
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
