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
    this.#init();
  }

  #init() {
    this.#initIcons();
  }

  _bindEvents() {
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
}
