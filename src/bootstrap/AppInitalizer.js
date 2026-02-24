import { createNidamApp } from "./NidamApp.js";

let appInstance = null;

/**
 * Initializes the NidamApp with an optional custom configuration.
 * If called manually, this prevents the default auto-initialization.
 * 
 * @param {import('../nidam.config.js').NidamConfig | string} [config={}] - The custom configuration
 * @returns {import('./NidamApp.js').default} The initialized app instance
 */
export default function initNidamApp(config = {}) {
    if (appInstance) {
        console.warn("[nidamjs] App is already initialized.");
        return appInstance;
    }

    appInstance = createNidamApp(config);
    return appInstance.initialize();
}

export function autoInit() {
    if (typeof document === "undefined") {
        return;
    }

    const isManual = document.querySelector('script[data-manual]');
    if (!appInstance && !isManual) {
        initNidamApp();
    }
}
