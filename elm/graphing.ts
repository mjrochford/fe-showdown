import * as THREE from "three"

export class TwoDGraph extends HTMLElement {
  private static DEFAULT_WIDTH = 640;
  private static DEFAULT_HEIGHT = 480;
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  scene: THREE.Scene;
  grid_size: number;
  constructor() {
    super();
    const self = this;
    self.grid_size = 1;

    window.addEventListener("resize", (_) => {
      self.init();
      self.update();
    });
  }

  init() {
    let w = this.parentElement?.clientWidth || TwoDGraph.DEFAULT_WIDTH;
    let h = this.parentElement?.clientHeight || TwoDGraph.DEFAULT_HEIGHT;
    this.canvas = document.createElement("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
    let alpha = 10;

    this.camera = new THREE.OrthographicCamera(-alpha, alpha, alpha, -alpha, 1, 10);
    this.camera.position.z = 1;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });

    for (let n of this.childNodes) {
      this.removeChild(n);
    }
    this.append(this.canvas);
    this.renderer.setClearColor(0x000000);
  }

  draw(expr: string) {
    const w = this.canvas.width, h = this.canvas.height;
    const drawLine = (p1: { x: number, y: number }, p2: { x: number, y: number }, color: number) => {
      let points: Array<THREE.Vector2> = [];
      points.push(new THREE.Vector2(p1.x, p1.y));
      points.push(new THREE.Vector2(p2.x, p2.y));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      let material = new THREE.LineBasicMaterial({ color });
      let line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }
    const drawAxes = () => {
      drawLine({ x: -w, y: 0 }, { x: w, y: 0 }, 0xffffff)
      drawLine({ x: 0, y: -h }, { x: 0, y: h }, 0xffffff)
    }
    const drawGrid = (size: number, w: number, h: number) => {
      for (let y = -h; y < h; y += size) { // horizontal lines
        drawLine({ x: -w, y }, { x: w, y }, 0x555555);
      }
      for (let x = -w; x < w; x += size) { // vertical
        drawLine({ x, y: -h }, { x, y: h }, 0x555555);
      }
    }

    const drawExpression = (expr: string, xsamples: number[]) => {
      let points: Array<THREE.Vector2> = [];
      for (let x of xsamples) {
        try {
          let y = eval(expr);
          points.push(new THREE.Vector2(x, y));
        } catch {
          break;
        }
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      let material = new THREE.LineBasicMaterial({ color: 0xffaaff });
      let line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }

    drawGrid(this.grid_size, 10, 10);
    drawAxes();
    let sampling_gain = 10;
    const xs = Array.from({ length: 2 * w * sampling_gain }, (_, x) => (x - w) / sampling_gain)
    drawExpression(expr, xs);
  }

  connectedCallback() {
    this.init();
    this.update();
  }
  attributeChangedCallback() { this.update(); }
  static get observedAttributes() {
    return ["expression"];
  }

  update() {
    if (!this.renderer) {
      return;
    }
    this.scene = new THREE.Scene();
    const expr = this.getAttribute("expression");
    if (!expr) return;
    try {
      let x = 0;
      let _ = eval(expr);
      this.draw(expr);
    } catch {
      console.log("bad expr");
    }

    this.renderer.render(this.scene, this.camera);
  }
}