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

// Auto-init after DOM is ready && no manual init was called
setTimeout(() => {
    if (!appInstance) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                if (!appInstance) init();
            });
        } else {
            init();
        }
    }
}, 0);
