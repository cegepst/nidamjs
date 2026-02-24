export { default as NidamApp, createNidamApp } from "./bootstrap/NidamApp.js";
export { default as BaseManager } from "./core/BaseManager.js";
export { default as ContentInitializer } from "./core/ContentInitializer.js";
export { default as EventDelegator } from "./core/EventDelegator.js";
export { default as DesktopIconManager } from "./features/desktop/DesktopIconManager.js";
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

import { createNidamApp } from "./bootstrap/NidamApp.js";

let appInstance = null;
let autoInitTimer = null;

/**
 * Initializes the NidamApp with an optional custom configuration.
 * If called manually, this prevents the default auto-initialization.
 * 
 * @param {import('./nidam.config.js').NidamConfig | string} [config={}] - The custom configuration
 * @returns {import('./bootstrap/NidamApp.js').default} The initialized app instance
 */
export default function init(config = {}) {
  if (autoInitTimer) {
    clearTimeout(autoInitTimer);
    autoInitTimer = null;
  }

  if (appInstance) {
    console.warn("[nidamjs] App is already initialized.");
    return appInstance;
  }

  appInstance = createNidamApp(config);
  return appInstance.initialize();
}

// Automatically initialize if the user doesn't call `init` synchronously
autoInitTimer = setTimeout(() => {
  if (!appInstance) {
    init();
  }
}, 0);
