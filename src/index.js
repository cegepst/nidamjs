export { default as NidamApp, createNidamApp } from "./bootstrap/NidamApp.js";
export { default as BaseManager } from "./core/BaseManager.js";
export { default as ContentInitializer } from "./core/ContentInitializer.js";
export { default as EventDelegator } from "./core/EventDelegator.js";
export { default as IconManager } from "./features/desktop/IconManager.js";
export { default as WindowManager } from "./features/window/WindowManager.js";
export { default as WindowRefresher } from "./features/window/WindowRefresher.js";
export { DOMUtils } from "./utils/dom.js";
export { handleRefreshEvent } from "./utils/eventUtils.js";
export { default as storageUtil } from "./utils/storageUtil.js";
export {
  applyWindowState,
  captureWindowState,
  readWindowState,
  saveWindowState,
} from "./utils/windowState.js";
export { default as initNidamApp } from "./bootstrap/AppInitalizer.js";
export { default } from "./bootstrap/AppInitalizer.js";

import { autoInit } from "./bootstrap/AppInitalizer.js";
autoInit();