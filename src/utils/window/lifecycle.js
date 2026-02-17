import { applyWindowState, readWindowState, saveWindowState } from "../../utils/windowState.js";

async function open(endpoint, force = false, focusSelector = null, activate = true) {
    // 1. Check Limits
    if (
        this._windows.size >= this._config.maxWindows &&
        !this._windows.has(endpoint)
    ) {
        const msg =
            document.body.dataset.errorMaxWindows ||
            `Maximum of ${this._config.maxWindows} windows allowed.`;
        this._notify("error", msg.replace("%s", String(this._config.maxWindows)));
        return Promise.reject(new Error("Max windows reached"));
    }

    // 2. Handle Existing Window
    if (this._windows.has(endpoint) && !force) {
        const winElement = this._windows.get(endpoint);
        if (activate) this._focusWindow(winElement);
        return Promise.resolve(winElement);
    }

    // 3. Check Pending Requests
    if (this._pendingRequests.has(endpoint)) {
        return this._pendingRequests.get(endpoint);
    }

    // 4. Cooldown Check
    const now = Date.now();
    if (
        !force &&
        now - (this._lastOpenTimestamps.get(endpoint) || 0) <
        this._config.cooldownMs
    ) {
        return Promise.resolve();
    }
    this._lastOpenTimestamps.set(endpoint, now);

    // 5. Fetch and Create
    const openPromise = (async () => {
        try {
            const html = await this._fetchWindowContent(endpoint, {
                force,
                focusSelector,
                activate,
                manager: this,
            });
            if (typeof html !== "string") {
                throw new TypeError("fetchWindowContent must return an HTML string");
            }

            // Handle Refresh
            if (this._windows.has(endpoint) && force) {
                const existingWin = this._windows.get(endpoint);

                // Skip silent refreshes if the window is busy (e.g. animation in progress)
                if (!activate && this._isWindowBusy(existingWin)) {
                    return existingWin;
                }

                this._refreshWindowContent(existingWin, html);
                if (activate) this._focusWindow(existingWin);
                if (focusSelector)
                    this._handleFocusSelector(existingWin, focusSelector);
                return existingWin;
            }

            const winElement = this._createWindowElement(html, endpoint);
            if (!winElement) {
                console.warn(`No .window element found for ${endpoint}`);
                return;
            }

            this._setupNewWindow(winElement, endpoint, focusSelector, activate);
            return winElement;
        } catch (error) {
            console.error("Error opening window:", error);
            const msg =
                document.body.dataset.errorOpenFailed || "Failed to open window.";
            this._notify("error", msg);
            throw error;
        } finally {
            this._pendingRequests.delete(endpoint);
        }
    })();

    this._pendingRequests.set(endpoint, openPromise);
    return openPromise;
}

function close(winElement) {
    const endpoint = winElement.dataset.endpoint;

    if (this._windows.get(endpoint) === winElement) {
        this._windows.delete(endpoint);
    }

    winElement.classList.add("animate-disappearance");
    winElement.classList.remove("animate-appearance");

    winElement.addEventListener(
        "animationend",
        () => {
            if (winElement.isConnected) winElement.remove();
        },
        { once: true },
    );
}

function _focusWindow(winElement) {
    this._zIndexCounter++;
    winElement.style.zIndex = this._zIndexCounter;
    winElement.classList.add("focused");
    this._windows.forEach((w) => {
        if (w !== winElement) w.classList.remove("focused");
    });
}

function _isWindowBusy(winElement) {
    if (winElement.dataset.isBusy === "true") return true;
    return winElement.querySelector('[data-is-busy="true"]') !== null;
}

function _refreshWindowContent(winElement, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const newContent = /** @type {HTMLElement|null} */ (
        doc.querySelector(".window")
    );

    if (!newContent) return;

    // Preserve state data before replacement
    const snapType = winElement.dataset.snapType;
    const prevState = winElement.dataset.prevState;
    const xRatio = winElement.dataset.xRatio;
    const yRatio = winElement.dataset.yRatio;
    const isFocused = winElement.classList.contains("focused");
    const isMaximized = winElement.classList.contains("maximized");
    const isTiled = winElement.classList.contains("tiled");

    // Preserve scroll state
    const scrollState = this._captureScrollState(winElement);

    winElement.innerHTML = newContent.innerHTML;
    winElement.className = newContent.className;

    // Re-apply states
    if (snapType) winElement.dataset.snapType = snapType;
    if (prevState) winElement.dataset.prevState = prevState;
    if (xRatio) winElement.dataset.xRatio = xRatio;
    if (yRatio) winElement.dataset.yRatio = yRatio;

    if (isFocused) winElement.classList.add("focused");
    if (isTiled) winElement.classList.add("tiled");
    if (isMaximized) {
        winElement.classList.add("maximized");
        this._updateMaximizeIcon(winElement, true);
    }

    // Sync Dimensions (Server provided style width/height)
    if (!isTiled && !isMaximized) {
        if (newContent.style.width)
            winElement.style.width = newContent.style.width;
        if (newContent.style.height)
            winElement.style.height = newContent.style.height;
    }

    // Re-assert positioning styles to prevent CSS jumps
    winElement.style.margin = "0";
    winElement.style.transform = "none";

    // Restore scroll state
    this._restoreScrollState(winElement, scrollState);

    // Re-initialize content modules
    this._initializeModalContent(winElement);
}

function _updateMaximizeIcon(winElement, isMaximized) {
    const icon = winElement.querySelector("[data-maximize] i");
    if (icon) {
        icon.classList.toggle("fa-expand", !isMaximized);
        icon.classList.toggle("fa-compress", isMaximized);
    }
}

function _createWindowElement(html, endpoint) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const winElement = /** @type {HTMLElement|null} */ (
        doc.querySelector(".window")
    );

    if (winElement) {
        winElement.dataset.endpoint = endpoint;
    }
    return winElement;
}

function _setupNewWindow(winElement, endpoint, focusSelector, activate = true) {
    // Style
    Object.assign(winElement.style, {
        position: "absolute",
        pointerEvents: "auto",
        margin: "0",
        transform: "none",
        visibility: "hidden",
    });

    this._root.appendChild(winElement);

    const cascadeIndex = this._windows.size;
    const defaultSnap = winElement.dataset.defaultSnap;
    if (defaultSnap) {
        const vw = window.innerWidth;
        const vh = window.innerHeight - this._config.taskbarHeight;
        this._snapWindow(winElement, defaultSnap, vw, vh);
    } else {
        this._positionWindow(winElement, cascadeIndex);
    }

    this._windows.set(endpoint, winElement);
    this._initializeModalContent(winElement);
    if (activate) this._focusWindow(winElement);

    winElement.style.visibility = "";
    if (!defaultSnap) {
        this._stabilizeInitialPlacement(winElement, cascadeIndex);
    }

    if (focusSelector) {
        this._handleFocusSelector(winElement, focusSelector);
    }
}

function _handleFocusSelector(winElement, selector) {
    const element = winElement.querySelector(selector);
    if (element) {
        if (element.type === "radio" || element.type === "checkbox") {
            element.checked = true;
        }
        element.focus();
    }
}

function _closeTopmostWindow() {
    let topWin = null;
    let maxZ = 0;

    this._windows.forEach((winElement) => {
        if (winElement.classList.contains("animate-disappearance")) return;
        const z = parseInt(winElement.style.zIndex || 0, 10);
        if (z > maxZ) {
            maxZ = z;
            topWin = winElement;
        }
    });

    if (topWin) this.close(topWin);
}

export {
    open,
    close,
    _focusWindow,
    _isWindowBusy,
    _refreshWindowContent,
    _updateMaximizeIcon,
    _createWindowElement,
    _setupNewWindow,
    _handleFocusSelector,
    _closeTopmostWindow
}