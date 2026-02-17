import {
  applyWindowState,
  captureWindowState,
  readWindowState,
  saveWindowState,
} from "../../src/utils/windowState.js";

describe("windowState utils", () => {
  test("captures and saves geometry from live element metrics", () => {
    document.body.innerHTML = `<div id="w"></div>`;
    const win = /** @type {HTMLElement} */ (document.querySelector("#w"));

    Object.defineProperty(win, "offsetWidth", {
      value: 640,
      configurable: true,
    });
    Object.defineProperty(win, "offsetHeight", {
      value: 315,
      configurable: true,
    });
    Object.defineProperty(win, "offsetLeft", {
      value: 120,
      configurable: true,
    });
    Object.defineProperty(win, "offsetTop", { value: 80, configurable: true });

    const captured = captureWindowState(win, { includePosition: true });
    const saved = saveWindowState(win, "prevState", { includePosition: true });
    const read = readWindowState(win);

    expect(captured).toEqual({
      width: "640px",
      height: "315px",
      left: "120px",
      top: "80px",
    });
    expect(saved).toEqual(captured);
    expect(read).toEqual(captured);
  });

  test("applies saved geometry to element styles", () => {
    document.body.innerHTML = `<div id="w"></div>`;
    const win = /** @type {HTMLElement} */ (document.querySelector("#w"));

    const applied = applyWindowState(
      win,
      {
        width: "700px",
        height: "400px",
        left: "20px",
        top: "40px",
      },
      { includePosition: true },
    );

    expect(applied).toBe(true);
    expect(win.style.width).toBe("700px");
    expect(win.style.height).toBe("400px");
    expect(win.style.left).toBe("20px");
    expect(win.style.top).toBe("40px");
  });

  test("re-parses when dataset changes and keeps cache coherent", () => {
    document.body.innerHTML = `<div id="w"></div>`;
    const win = /** @type {HTMLElement} */ (document.querySelector("#w"));

    win.dataset.prevState = JSON.stringify({ width: "500px", height: "300px" });
    const first = readWindowState(win);
    const second = readWindowState(win);

    expect(first).toEqual({
      width: "500px",
      height: "300px",
      left: "",
      top: "",
    });
    expect(second).toEqual(first);

    win.dataset.prevState = JSON.stringify({ width: "720px", height: "410px" });
    const third = readWindowState(win);
    expect(third).toEqual({
      width: "720px",
      height: "410px",
      left: "",
      top: "",
    });
  });
});
