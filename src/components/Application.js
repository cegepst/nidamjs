import WindowManager from "../features/window/WindowManager.js";
import WindowRefresher from "../features/window/WindowRefresher.js";
import ContentInitializer from "./ContentInitializer.js";
import EventDelegator from "./EventDelegator.js";
import { initializeLocalStorage } from "../utils/storage/storage.js";

export default class Application {
  #config;
  #modules = new Map();
  #delegator = null;

  constructor(config) {
    this.#config = config;
  }

  initialize() {
    this.#initializeLocalStorage();
    this.#initializeFetchGuard();
    this.#initializeEventDelegation();
    this.#initializeWindowManagement();
    this.#initializeStaticContent();
  }

  #initializeLocalStorage() {
    initializeLocalStorage();
  }

  #initializeFetchGuard() {
    if (window.__fetchGuardInstalled) return;
    window.__fetchGuardInstalled = true;

    const baseFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await baseFetch(...args);

      if (
        response.redirected ||
        response.type === "opaqueredirect" ||
        response.status === 401 ||
        response.status === 403
      ) {
        window.location.href = response.url || "/login";
      }

      return response;
    };
  }

  #initializeEventDelegation() {
    this.#delegator = new EventDelegator(document);
    this.#modules.set("delegator", this.#delegator);
  }

  #initializeWindowManagement() {
    this.#tryInitialize("window", () => {
      const container = document.querySelector(this.#config.modalContainer);
      if (container) {
        const windowManager = new WindowManager(
          container,
          this.#delegator,
          () => this.#modules,
        );
        // Initialize WindowManager singleton
        this.#modules.set("window", windowManager);
        this.#openPendingWindow(container, windowManager);

        // Initialize WindowRefresher singletion
        const refresher = new WindowRefresher(windowManager);
        this.#modules.set("refresher", refresher);
      }
    });
  }

  #openPendingWindow(container, windowManager) {
    const pending = (container.dataset.pendingModal || "").trim();
    if (!pending) {
      return;
    }

    const normalized = pending.startsWith("/") ? pending.slice(1) : pending;
    windowManager.open(normalized);
  }

  #initializeStaticContent() {
    ContentInitializer.initialize(this.#delegator, document, this.#modules);
  }

  #tryInitialize(name, initFn) {
    try {
      initFn();
    } catch (error) {
      console.warn(`Module ${name} initialization skipped:`, error.message);
    }
  }
}
