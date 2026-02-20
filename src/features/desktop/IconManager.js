import BaseManager from "../../core/BaseManager.js";
import storageUtil from "../../utils/storageUtil.js";

export default class IconManager extends BaseManager {

  _key = "desktop-icons";

  /**
   * @param {string} container
   * @param {import("../../index.js").EventDelegator} delegator
   */
  constructor(container, delegator) {
    super(container, delegator);
    this._loadLayout();
  }

  _loadLayout() {
    try {
      const savedLayout = storageUtil.get(this._key, []);

      if (!savedLayout || !Array.isArray(savedLayout)) return;

      const icons = /** @type {NodeListOf<HTMLElement>} */ (
        this._queryAll("[nd-icon]")
      );

      icons.forEach((icon) => {
        const id = icon.dataset.modal;
        const savedIcon = savedLayout.find((item) => item.id === id);

        if (id && savedIcon && Array.isArray(savedIcon.classes)) {
          const existingClasses = Array.from(icon.classList).filter(
            (c) =>
              c.startsWith("col-start-") ||
              c.startsWith("row-start-") ||
              c.startsWith("col-end-"),
          );
          icon.classList.remove(...existingClasses);

          icon.classList.add(...savedIcon.classes);
        }
      });
    } catch (e) {
      console.error("Failed to load desktop layout", e);
    }
  }

  _bindEvents() {
    this._delegator.on(
      "mousedown",
      "[nd-icon]",
      this._handleDragStart.bind(this),
    );
  }

  _handleDragStart(e, target) {
    if (e.button !== 0) return;

    e.preventDefault();

    const icon = target.closest("[nd-icon]");
    const rect = icon.getBoundingClientRect();
    const containerRect = this._root.getBoundingClientRect();

    const gridClasses = Array.from(icon.classList).filter(
      (c) =>
        c.startsWith("col-start-") ||
        c.startsWith("row-start-") ||
        c.startsWith("col-end-"),
    );

    this._dragState = {
      element: icon,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left - containerRect.left,
      initialTop: rect.top - containerRect.top,
      containerRect: containerRect,
      originalClasses: gridClasses,
    };

    icon.style.left = `${this._dragState.initialLeft}px`;
    icon.style.top = `${this._dragState.initialTop}px`;
    icon.style.width = `${rect.width}px`;
    icon.style.position = "absolute";

    icon.classList.remove(...gridClasses);
    icon.classList.add("dragging");

    this._dragHandlers = {
      move: this._handleDragMove.bind(this),
      stop: this._handleDragStop.bind(this),
    };

    document.addEventListener("mousemove", this._dragHandlers.move);
    document.addEventListener("mouseup", this._dragHandlers.stop);
  }

  _handleDragMove(e) {
    if (!this._dragState) return;

    const { element, startX, startY, initialLeft, initialTop, containerRect } =
      this._dragState;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newLeft = initialLeft + deltaX;
    let newTop = initialTop + deltaY;

    const maxLeft = containerRect.width - element.offsetWidth;
    const maxTop = containerRect.height - element.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    element.style.left = `${newLeft}px`;
    element.style.top = `${newTop}px`;
  }

  _handleDragStop(e) {
    if (!this._dragState) return;

    const { element, startX, startY, originalClasses } = this._dragState;

    const moveX = Math.abs(e.clientX - startX);
    const moveY = Math.abs(e.clientY - startY);
    const wasDragging = moveX > 5 || moveY > 5;

    element.classList.remove("dragging");
    element.style.zIndex = "";

    if (wasDragging) {
      const preventClick = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
      };
      element.addEventListener("click", preventClick, {
        capture: true,
        once: true,
      });

      this._snapToGrid(element);
    } else {
      element.style.position = "";
      element.style.left = "";
      element.style.top = "";
      element.style.width = "";
      element.classList.add(...originalClasses);
    }

    this._saveLayout();

    document.removeEventListener("mousemove", this._dragHandlers.move);
    document.removeEventListener("mouseup", this._dragHandlers.stop);
    this._dragState = null;
  }

  _snapToGrid(element) {
    const containerRect = this._root.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    let cols = 2;
    if (window.innerWidth >= 1280) cols = 10;
    else if (window.innerWidth >= 1024) cols = 8;
    else if (window.innerWidth >= 768) cols = 6;

    const rows = 3;

    const colWidth = containerRect.width / cols;
    const rowHeight = containerRect.height / rows;
    const centerX =
      elementRect.left - containerRect.left + elementRect.width / 2;
    const centerY =
      elementRect.top - containerRect.top + elementRect.height / 2;

    let colIndex = Math.floor(centerX / colWidth) + 1;
    let rowIndex = Math.floor(centerY / rowHeight) + 1;

    colIndex = Math.max(1, Math.min(colIndex, cols));
    rowIndex = Math.max(1, Math.min(rowIndex, rows));

    const targetColClass = `col-start-${colIndex}`;
    const targetRowClass = `row-start-${rowIndex}`;

    const collidingElement = Array.from(
      /** @type {NodeListOf<HTMLElement>} */ (
        this._root.querySelectorAll("[nd-icon]")
      ),
    ).find(
      (icon) =>
        icon !== element &&
        icon.classList.contains(targetColClass) &&
        icon.classList.contains(targetRowClass),
    );

    if (collidingElement) {
      element.style.position = "";
      element.style.left = "";
      element.style.top = "";
      element.style.width = "";

      if (this._dragState && this._dragState.originalClasses) {
        const currentClassesToRemove = Array.from(element.classList).filter(
          (c) =>
            c.startsWith("col-start-") ||
            c.startsWith("row-start-") ||
            c.startsWith("col-end-"),
        );
        element.classList.remove(...currentClassesToRemove);

        element.classList.add(...this._dragState.originalClasses);
      }
      return;
    }

    element.style.position = "";
    element.style.left = "";
    element.style.top = "";
    element.style.width = "";

    const classesToRemove = Array.from(element.classList).filter(
      (c) =>
        c.startsWith("col-start-") ||
        c.startsWith("row-start-") ||
        c.startsWith("col-end-"),
    );
    element.classList.remove(...classesToRemove);

    element.classList.add(targetColClass, targetRowClass);
  }

  _saveLayout() {
    const layout = [];
    const icons = /** @type {NodeListOf<HTMLElement>} */ (
      this._root.querySelectorAll("[nd-icon]")
    );

    icons.forEach((icon) => {
      const id = icon.dataset.modal;
      if (id) {
        const gridClasses = Array.from(icon.classList).filter(
          (c) => c.startsWith("col-start-") || c.startsWith("row-start-"),
        );
        layout.push({
          id: id,
          classes: gridClasses,
        });
      }
    });

    storageUtil.set(this._key, layout);
  }
}
