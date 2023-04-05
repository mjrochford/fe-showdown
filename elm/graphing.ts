import * as THREE from "three"

/** TODO

- Detect discontinous functions
- Zoom
- onClick 
- Label Axes
*/

export class ExpressionGraph extends HTMLElement {
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private camera: THREE.OrthographicCamera
  private scene: THREE.Scene
  private grid_size: number
  private zoom_level: number
  private xs: number[]
  constructor() {
    super()
    const self = this
    self.grid_size = 1

    window.addEventListener("resize", (_) => {
      self.init()
      self.update()
    })
  }

  init() {
    const self = this
    let w = this.parentElement?.clientWidth || 640
    let h = this.parentElement?.clientHeight || 480
    let sampling_gain = 10
    let nxs = 2 * w * sampling_gain;
    this.xs = Array.from({ length: nxs }, (_, x) => (x - nxs / 2) / sampling_gain)
    this.canvas = document.createElement("canvas")
    this.canvas.width = w
    this.canvas.height = h

    let aspect_ratio = w / h
    this.zoom_level = 10
    if (w > h) {
      this.camera = new THREE.OrthographicCamera(-this.zoom_level, this.zoom_level, this.zoom_level / aspect_ratio, -this.zoom_level / aspect_ratio, 1, 10)
    } else {
      this.camera = new THREE.OrthographicCamera(-this.zoom_level * aspect_ratio, this.zoom_level * aspect_ratio, this.zoom_level, -this.zoom_level, 1, 10)
    }
    this.camera.position.z = 1
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })

    for (let n of this.childNodes) {
      this.removeChild(n)
    }
    this.append(this.canvas)

    this.addEventListener("wheel", (ev) => {
      let nudge = ev.deltaY / Math.abs(ev.deltaY)
      this.zoom(nudge)
      self.camera.updateProjectionMatrix()
      self.update()
    })

    this.renderer.setClearColor(0x000000)
  }

  /**
  zoom(amount) -> 
    zooms by the specified amount positive for zooming out negative for zooming in
   */
  zoom(amount: number) {
    const self = this
    const zoom_speed = 1 / 10;
    const { width: w, height: h } = self.canvas
    const aspect_ratio = w / h
    this.zoom_level = this.zoom_level + (amount * this.zoom_level * zoom_speed)
    const limit = 0.000000000000001;
    if (this.zoom_level < limit)
      this.zoom_level = limit;

    if (w > h) {
      this.camera.left = -this.zoom_level
      this.camera.right = this.zoom_level
      this.camera.top = this.zoom_level / aspect_ratio
      this.camera.bottom = -this.zoom_level / aspect_ratio
    } else {
      this.camera.left = -this.zoom_level * aspect_ratio
      this.camera.right = this.zoom_level * aspect_ratio
      this.camera.top = this.zoom_level
      this.camera.bottom = -this.zoom_level
    }
  }

  draw(expr: string) {
    const { left, right, top, bottom } = this.camera
    const drawLine = (p1: { x: number, y: number }, p2: { x: number, y: number }, color: number) => {
      let points: Array<THREE.Vector2> = []
      points.push(new THREE.Vector2(p1.x, p1.y))
      points.push(new THREE.Vector2(p2.x, p2.y))

      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      let material = new THREE.LineBasicMaterial({ color })
      let line = new THREE.Line(geometry, material)
      this.scene.add(line)
    }
    const drawAxes = () => {
      const arrow_len = (right - left) / 100
      let [a, b, c, d] = [{ x: 0, y: top }, { x: right, y: 0 }, { x: 0, y: bottom }, { x: left, y: 0 }]
      drawLine(a, { x: a.x + arrow_len, y: a.y - arrow_len }, 0xffffff)
      drawLine(a, { x: a.x - arrow_len, y: a.y - arrow_len }, 0xffffff)

      drawLine(b, { x: b.x - arrow_len, y: b.y - arrow_len }, 0xffffff)
      drawLine(b, { x: b.x - arrow_len, y: b.y + arrow_len }, 0xffffff)

      drawLine(c, { x: c.x + arrow_len, y: c.y + arrow_len }, 0xffffff)
      drawLine(c, { x: c.x - arrow_len, y: c.y + arrow_len }, 0xffffff)

      drawLine(d, { x: d.x + arrow_len, y: d.y - arrow_len }, 0xffffff)
      drawLine(d, { x: d.x + arrow_len, y: d.y + arrow_len }, 0xffffff)

      drawLine(d, b, 0xffffff)
      drawLine(a, c, 0xffffff)
    }
    const drawGrid = (size: number, w: number, h: number) => {
      for (let y = 0; y < h; y += size) { // horizontal lines
        drawLine({ x: -w, y }, { x: w, y }, 0x555555)
      }
      for (let y = 0; y > -h; y -= size) { // horizontal lines
        drawLine({ x: -w, y }, { x: w, y }, 0x555555)
      }

      for (let x = 0; x < w; x += size) { // vertical
        drawLine({ x, y: -h }, { x, y: h }, 0x555555)
      }
      for (let x = 0; x > -w; x -= size) { // vertical
        drawLine({ x, y: -h }, { x, y: h }, 0x555555)
      }
    }

    const drawExpression = (sampling_fn: (x: number) => [number, number], samples: number[]) => {
      let material = new THREE.LineBasicMaterial({ color: 0xffaaff })
      let points: Array<THREE.Vector2> = []
      for (let s of samples) {
        try {
          let [x, y] = sampling_fn(s)
          points.push(new THREE.Vector2(x, y))
        } catch {
          break
        }
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      let line = new THREE.Line(geometry, material)
      this.scene.add(line)
    }

    drawGrid(this.grid_size * right / 5, right, top)
    drawAxes()

    let polar_coords_re = /r\s*=\s*(.*)/
    let match = polar_coords_re.exec(expr)
    if (match) {
      expr = match?.[1]
      let gain = 3
      let ts = Array.from({ length: 360 * gain }, (_, x) => x * Math.PI / 180)
      drawExpression((t: number) => {
        let r = eval(expr)
        let x = r * Math.cos(t)
        return [x, r * Math.sin(t)]
      }, ts)
    } else {
      drawExpression((x: number) => [x, eval(expr)], this.xs)
    }
  }

  connectedCallback() {
    this.init()
    this.update()
  }
  attributeChangedCallback() { this.update() }
  static get observedAttributes() {
    return ["expression"]
  }

  update() {
    if (!this.renderer) {
      return
    }
    this.scene = new THREE.Scene()

    const expr = this.getAttribute("expression")
    if (!expr) return
    try {
      this.draw(expr)
    } catch {
      console.log("bad expr")
    }

    this.renderer.render(this.scene, this.camera)
  }
}