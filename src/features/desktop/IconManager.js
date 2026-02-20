import BaseManager from "../../core/BaseManager.js";

export default class IconManager extends BaseManager {

  _key = "desktop-icons";

  /**
   * @param {string} container
   * @param {import("../../index.js").EventDelegator} delegator
   */
  constructor(container, delegator) {
    super(container, delegator);
    this.#init();
  }

  #init() {
    this.#initIcons();
  }

  _bindEvents() {
    this._on(
      "mousedown",
      "[nd-icon]",
      this._handleStartDrag.bind(this)
    );
  }

  #initIcons() {
    const icons = this._queryAll("[nd-icon]");

    icons.forEach(icon => {
      const value = icon.getAttribute("nd-icon");
      if (!value) return;

      const parts = value.split(":");
      if (parts.length !== 2) return;

      const col = parseInt(parts[0].trim(), 10);
      const row = parseInt(parts[1].trim(), 10);

      if (Number.isFinite(col)) {
        icon.style.gridColumnStart = col.toString();
      }

      if (Number.isFinite(row)) {
        icon.style.gridRowStart = row.toString();
      }
    });
  }

  /**
   * @param {{ button: number; preventDefault: () => void; }} e
   * @param {{ setAttribute: (arg0: string, arg1: string) => void; }} target
   */
  _handleStartDrag(e, target) {
    if (e.button !== 0) return;

    e.preventDefault();

    const containerRect = this._root.getBoundingClientRect();
    const style = getComputedStyle(this._root);

    const cols = parseInt(style.getPropertyValue("--nd-cols"), 10);
    const rows = parseInt(style.getPropertyValue("--nd-rows"), 10);

    const cellW = containerRect.width / cols;
    const cellH = containerRect.height / rows;

    let lastX;
    let lastY;

    const move = (ev) => {
      lastX = ev.clientX;
      lastY = ev.clientY;
    };

    const stop = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);

      if (lastX === undefined) return;

      const x = lastX - containerRect.left;
      const y = lastY - containerRect.top;

      let col = Math.floor(x / cellW) + 1;
      let row = Math.floor(y / cellH) + 1;

      col = Math.max(1, Math.min(col, cols));
      row = Math.max(1, Math.min(row, rows));

      target.setAttribute("nd-icon", `${col}:${row}`);

      this.#initIcons();
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  }
}