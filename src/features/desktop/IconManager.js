import BaseManager from "../../core/BaseManager.js";
import { calculateGridPosition, isPositionOccupied, parseCoords } from "../../utils/desktop/iconUtil.js";
import storageUtil from "../../utils/storageUtil.js";

export default class IconManager extends BaseManager {
    _key = "nd-icons-layout";

    constructor(container, delegator) {
        super(container, delegator);
        this.#init();
    }

    #init() {
        this.#applyGridDimensions();
        this.#loadLayout();
        this.#updateGridStyles();
    }

    _bindEvents() {
        this._on("mousedown", "[nd-icon]", this._handleStartDrag.bind(this));
    }

    #applyGridDimensions() {
        const dimensions = this._root.getAttribute("nd-icons");
        if (!dimensions) return;

        const [cols, rows] = dimensions.split(":").map(Number);

        if (cols && rows) {
            this._root.style.setProperty("--nd-cols", cols);
            this._root.style.setProperty("--nd-rows", rows);
        }
    }

    #loadLayout() {
        const savedLayout = storageUtil.get(this._key, {});

        this._queryAll("[nd-icon]").forEach(icon => {
            const id = icon.getAttribute("nd-id");
            if (!id) return;

            const savedPosition = savedLayout[id];
            if (savedPosition) {
                icon.setAttribute("nd-icon", savedPosition);
            }
        });
    }

    #updateGridStyles() {
        const dimensions = this._root.getAttribute("nd-icons");
        if (!dimensions) return;
        const [maxCols, maxRows] = dimensions.split(":").map(Number);

        this._queryAll("[nd-icon]").forEach(icon => {
            const coords = parseCoords(icon.getAttribute("nd-icon"));
            if (!coords) return;

            const safeCol = Math.max(1, Math.min(coords.col, maxCols));
            const safeRow = Math.max(1, Math.min(coords.row, maxRows));

            icon.style.gridColumnStart = safeCol.toString();
            icon.style.gridRowStart = safeRow.toString();

            icon.setAttribute("nd-icon", `${safeCol}:${safeRow}`);
        });
    }

    _handleStartDrag(e, target) {
        if (e.button !== 0) return;
        e.preventDefault();

        const dragDelay = 200;
        const deadzone = 40;
        const startX = e.clientX;
        const startY = e.clientY;

        let ghost, lastX, lastY;
        let move, stop;
        let dragStarted = false;

        const timer = setTimeout(() => {
            move = (ev) => {
                const deltaX = ev.clientX - startX;
                const deltaY = ev.clientY - startY;

                if (!dragStarted && Math.hypot(deltaX, deltaY) < deadzone) return;

                if (!dragStarted) {
                    dragStarted = true;

                    ghost = target.cloneNode(true);
                    ghost.classList.add("nd-icon-ghost");
                    ghost.removeAttribute("nd-icon");
                    document.body.appendChild(ghost);
                    target.classList.add("is-dragging");

                    lastX = startX;
                    lastY = startY;

                    ghost.style.left = `${lastX}px`;
                    ghost.style.top = `${lastY}px`;
                }

                lastX = ev.clientX;
                lastY = ev.clientY;
                ghost.style.left = `${lastX}px`;
                ghost.style.top = `${lastY}px`;
            };

            stop = () => {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", stop);

                if (ghost) ghost.remove();
                target.classList.remove("is-dragging");

                if (!dragStarted || lastX === undefined) return;

                const containerRect = this._root.getBoundingClientRect();
                const style = getComputedStyle(this._root);
                const gridConfig = {
                    cols: parseInt(style.getPropertyValue("--nd-cols"), 10),
                    rows: parseInt(style.getPropertyValue("--nd-rows"), 10)
                };

                const { posString } = calculateGridPosition(lastX, lastY, containerRect, gridConfig);
                const icons = this._queryAll("[nd-icon]");

                if (isPositionOccupied(icons, target, posString)) return;

                target.setAttribute("nd-icon", posString);
                this.#updateGridStyles();
                this.#saveLayout();
            };

            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", stop);
        }, dragDelay);

        const cancelDrag = () => clearTimeout(timer);
        document.addEventListener("mouseup", cancelDrag, { once: true });
    }

    #saveLayout() {
        const layout = {};

        this._queryAll("[nd-icon]").forEach(icon => {
            const id = icon.getAttribute("nd-id");
            if (!id) return;

            layout[id] = icon.getAttribute("nd-icon");
        });

        storageUtil.set(this._key, layout);
    }
}
