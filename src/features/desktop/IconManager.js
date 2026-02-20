import BaseManager from "../../core/BaseManager.js";
import { parseCoords, calculateGridPosition, isPositionOccupied } from "../../utils/desktop/iconUtil.js";

export default class IconManager extends BaseManager {
  _key = "desktop-icons";

  constructor(container, delegator) {
    super(container, delegator);
    this.#init();
  }

  #init() {
    this.#updateGridStyles();
  }

  _bindEvents() {
    this._on("mousedown", "[nd-icon]", this._handleStartDrag.bind(this));
  }

  #updateGridStyles() {
    this._queryAll("[nd-icon]").forEach(icon => {
      const coords = parseCoords(icon.getAttribute("nd-icon"));
      if (!coords) return;

      icon.style.gridColumnStart = coords.col.toString();
      icon.style.gridRowStart = coords.row.toString();
    });
  }

  _handleStartDrag(e, target) {
    if (e.button !== 0) return;
    e.preventDefault();

    const containerRect = this._root.getBoundingClientRect();
    const style = getComputedStyle(this._root);
    const gridConfig = {
      cols: parseInt(style.getPropertyValue("--nd-cols"), 10),
      rows: parseInt(style.getPropertyValue("--nd-rows"), 10)
    };

    const ghost = target.cloneNode(true);
    ghost.classList.add("nd-icon-ghost");
    ghost.removeAttribute("nd-icon");
    document.body.appendChild(ghost);
    
    target.classList.add("is-dragging");

    let lastX = e.clientX;
    let lastY = e.clientY;

    ghost.style.left = `${lastX}px`;
    ghost.style.top = `${lastY}px`;

    const move = (ev) => {
      lastX = ev.clientX;
      lastY = ev.clientY;
      ghost.style.left = `${lastX}px`;
      ghost.style.top = `${lastY}px`;
    };

    const stop = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);

      ghost.remove();
      target.classList.remove("is-dragging");

      if (lastX === undefined) return;

      const { posString } = calculateGridPosition(lastX, lastY, containerRect, gridConfig);
      const icons = this._queryAll("[nd-icon]");

      if (isPositionOccupied(icons, target, posString)) return;

      target.setAttribute("nd-icon", posString);
      this.#updateGridStyles();
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  }
}