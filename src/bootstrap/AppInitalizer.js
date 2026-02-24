import { createNidamApp } from "./NidamApp.js";

let appInstance = null;

/**
 * Initializes the NidamApp with an optional custom configuration.
 * If called manually, this prevents the default auto-initialization.
 * 
 * @param {import('../nidam.config.js').NidamConfig | string} [config={}] - The custom configuration
 * @returns {import('./NidamApp.js').default} The initialized app instance
 */
export default function init(config = {}) {
    if (appInstance) {
        console.warn("[nidamjs] App is already initialized.");
        return appInstance;
    }

    appInstance = createNidamApp(config);
    return appInstance.initialize();
}

// Auto-init safely: 
// 1. Give synchronous code a chance to call `init()` first
// 2. Only initialize when the DOM is ready
setTimeout(() => {
    if (!appInstance) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                // Double check in case they called init() between now and DOM ready
                if (!appInstance) init();
            });
        } else {
            init();
        }
    }
}, 0);
