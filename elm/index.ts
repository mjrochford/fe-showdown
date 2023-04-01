import { Elm } from "./Main.elm"
import { TwoDGraph } from "./graphing.ts"

customElements.define("twod-expr-graph", TwoDGraph);

addEventListener("DOMContentLoaded", () => {
  const app = Elm.Main.init({
    node: document.querySelector("main"),
    // flags: "x * x * Math.sin(x)",
    flags: "r = 4 * Math.cos(3*t)",
  })
})
