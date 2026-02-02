// Mock WebGL context for Vitest
const originalGetContext = HTMLCanvasElement.prototype.getContext;

// Create a comprehensive WebGL mock
const createWebGLMock = (canvas: HTMLCanvasElement) => ({
  canvas,
  drawingBufferWidth: canvas.width,
  drawingBufferHeight: canvas.height,
  getContextAttributes: () => ({
    alpha: true,
    antialias: true,
    depth: true,
    stencil: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "default",
    failIfMajorPerformanceCaveat: false,
    desynchronized: false,
  }),
  isContextLost: () => false,
  getParameter: (pname: number) => {
    // GL constants commonly queried by Pixi.js
    const GL = {
      VERSION: 0x1f02,
      RENDERER: 0x1f01,
      MAX_TEXTURE_SIZE: 0x0d33,
      MAX_VERTEX_ATTRIBS: 0x8869,
      MAX_TEXTURE_IMAGE_UNITS: 0x8872,
      MAX_RENDERBUFFER_SIZE: 0x84e8,
      MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8b4d,
      MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
      ALIASED_LINE_WIDTH_RANGE: 0x846e,
      ALIASED_POINT_SIZE_RANGE: 0x846d,
    };
    if (pname === GL.MAX_TEXTURE_SIZE) return 4096;
    if (pname === GL.MAX_VERTEX_ATTRIBS) return 16;
    if (pname === GL.MAX_TEXTURE_IMAGE_UNITS) return 16;
    if (pname === GL.VERSION) return "WebGL 1.0 (Mock)";
    if (pname === GL.RENDERER) return "Mock Renderer";
    return null;
  },
  getExtension: (name: string) => {
    // Return mock extensions that Pixi.js commonly uses
    const extensions: Record<string, any> = {
      WEBGL_lose_context: {
        loseContext: () => {},
        restoreContext: () => {},
      },
      WEBGL_draw_buffers: {},
      OES_vertex_array_object: {},
      ANGLE_instanced_arrays: {},
    };
    return extensions[name] || null;
  },
  getSupportedExtensions: () => [
    "WEBGL_lose_context",
    "WEBGL_draw_buffers",
    "OES_vertex_array_object",
    "ANGLE_instanced_arrays",
  ],
  activeTexture: () => {},
  attachShader: () => {},
  bindAttribLocation: () => {},
  bindBuffer: () => {},
  bindFramebuffer: () => {},
  bindRenderbuffer: () => {},
  bindTexture: () => {},
  blendColor: () => {},
  blendEquation: () => {},
  blendEquationSeparate: () => {},
  blendFunc: () => {},
  blendFuncSeparate: () => {},
  bufferData: () => {},
  bufferSubData: () => {},
  checkFramebufferStatus: () => 0x8cd5, // FRAMEBUFFER_COMPLETE
  clear: () => {},
  clearColor: () => {},
  clearDepth: () => {},
  clearStencil: () => {},
  colorMask: () => {},
  compileShader: () => {},
  createBuffer: () => ({}),
  createFramebuffer: () => ({}),
  createProgram: () => ({}),
  createRenderbuffer: () => ({}),
  createShader: () => ({}),
  createTexture: () => ({}),
  cullFace: () => {},
  deleteBuffer: () => {},
  deleteFramebuffer: () => {},
  deleteProgram: () => {},
  deleteRenderbuffer: () => {},
  deleteShader: () => {},
  deleteTexture: () => {},
  depthFunc: () => {},
  depthMask: () => {},
  depthRange: () => {},
  detachShader: () => {},
  disable: () => {},
  disableVertexAttribArray: () => {},
  drawArrays: () => {},
  drawElements: () => {},
  enable: () => {},
  enableVertexAttribArray: () => {},
  finish: () => {},
  flush: () => {},
  framebufferRenderbuffer: () => {},
  framebufferTexture2D: () => {},
  frontFace: () => {},
  generateMipmap: () => {},
  getActiveAttrib: () => ({ name: "", size: 1, type: 0x1406 }),
  getActiveUniform: () => ({ name: "", size: 1, type: 0x1406 }),
  getAttachedShaders: () => [],
  getAttribLocation: () => 0,
  getBufferParameter: () => null,
  getError: () => 0, // NO_ERROR
  getFramebufferAttachmentParameter: () => null,
  getProgramParameter: () => true,
  getProgramInfoLog: () => "",
  getRenderbufferParameter: () => null,
  getShaderParameter: () => true,
  getShaderPrecisionFormat: () => ({
    precision: 23,
    rangeMin: 127,
    rangeMax: 127,
  }),
  getShaderInfoLog: () => "",
  getShaderSource: () => "",
  getTexParameter: () => null,
  getUniform: () => null,
  getUniformLocation: () => ({}),
  getVertexAttrib: () => null,
  getVertexAttribOffset: () => 0,
  hint: () => {},
  isBuffer: () => false,
  isEnabled: () => false,
  isFramebuffer: () => false,
  isProgram: () => false,
  isRenderbuffer: () => false,
  isShader: () => false,
  isTexture: () => false,
  lineWidth: () => {},
  linkProgram: () => {},
  pixelStorei: () => {},
  polygonOffset: () => {},
  readPixels: () => {},
  renderbufferStorage: () => {},
  sampleCoverage: () => {},
  scissor: () => {},
  shaderSource: () => {},
  stencilFunc: () => {},
  stencilFuncSeparate: () => {},
  stencilMask: () => {},
  stencilMaskSeparate: () => {},
  stencilOp: () => {},
  stencilOpSeparate: () => {},
  texImage2D: () => {},
  texParameterf: () => {},
  texParameteri: () => {},
  texSubImage2D: () => {},
  uniform1f: () => {},
  uniform1fv: () => {},
  uniform1i: () => {},
  uniform1iv: () => {},
  uniform2f: () => {},
  uniform2fv: () => {},
  uniform2i: () => {},
  uniform2iv: () => {},
  uniform3f: () => {},
  uniform3fv: () => {},
  uniform3i: () => {},
  uniform3iv: () => {},
  uniform4f: () => {},
  uniform4fv: () => {},
  uniform4i: () => {},
  uniform4iv: () => {},
  uniformMatrix2fv: () => {},
  uniformMatrix3fv: () => {},
  uniformMatrix4fv: () => {},
  useProgram: () => {},
  validateProgram: () => {},
  vertexAttrib1f: () => {},
  vertexAttrib1fv: () => {},
  vertexAttrib2f: () => {},
  vertexAttrib2fv: () => {},
  vertexAttrib3f: () => {},
  vertexAttrib3fv: () => {},
  vertexAttrib4f: () => {},
  vertexAttrib4fv: () => {},
  vertexAttribPointer: () => {},
  viewport: () => {},
});

HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  contextId: string,
  ...args: unknown[]
) {
  if (contextId === "webgl" || contextId === "webgl2") {
    return createWebGLMock(this) as unknown as WebGLRenderingContext;
  }
  return (originalGetContext as any).call(this, contextId, ...args);
} as any;

// Mock AudioContext for Music System testing
class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  };
  connect = () => {};
  disconnect = () => {};
}

class MockOscillatorNode {
  type: OscillatorType = "sine";
  frequency = {
    value: 440,
    setValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  };
  connect = () => {};
  disconnect = () => {};
  start = () => {};
  stop = () => {};
}

class MockBiquadFilterNode {
  type: BiquadFilterType = "lowpass";
  frequency = { value: 1000 };
  connect = () => {};
  disconnect = () => {};
}

class MockAudioBufferSourceNode {
  buffer = null;
  connect = () => {};
  disconnect = () => {};
  start = () => {};
  stop = () => {};
}

class MockAudioBuffer {
  numberOfChannels;
  length;
  sampleRate;

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
  }
  getChannelData = () => new Float32Array(this.length);
}

class MockAudioContext {
  state: AudioContextState = "running";
  currentTime = 0;
  sampleRate = 44100;
  destination = {} as AudioDestinationNode;

  createGain = () => new MockGainNode() as unknown as GainNode;
  createOscillator = () =>
    new MockOscillatorNode() as unknown as OscillatorNode;
  createBiquadFilter = () =>
    new MockBiquadFilterNode() as unknown as BiquadFilterNode;
  createBufferSource = () =>
    new MockAudioBufferSourceNode() as unknown as AudioBufferSourceNode;
  createBuffer = (channels: number, length: number, sampleRate: number) =>
    new MockAudioBuffer(channels, length, sampleRate) as unknown as AudioBuffer;
  resume = () => Promise.resolve();
  close = () => Promise.resolve();
}

// Assign mock to window
(globalThis as unknown as { AudioContext: typeof AudioContext }).AudioContext =
  MockAudioContext as unknown as typeof AudioContext;
