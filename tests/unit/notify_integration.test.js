import { describe, test, expect, vi, beforeEach } from "vitest";
import { createNidamApp } from "../../src/bootstrap/NidamApp.js";
import WindowManager from "../../src/features/window/WindowManager.js";
import { createToastNotify, toastNotify } from "../../src/utils/toast.js";

const createDelegatorStub = () => ({
  on: vi.fn(),
});

describe("Notification Integration", () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<section nd-icons="2:2"></section><div id="target"></div>';
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      configurable: true,
    });
  });

  test("WindowManager uses custom notify callback (console.log style)", async () => {
    const notify = vi.fn();
    const container = document.querySelector("#target");
    const manager = new WindowManager(container, createDelegatorStub(), {
      notify,
      config: { maxWindows: 0 }, // Trigger max windows error immediately
    });

    await expect(manager.open("test")).rejects.toThrow();
    expect(notify).toHaveBeenCalledWith("error", expect.any(String));
  });

  test("WindowManager uses toast notify by default", async () => {
    const container = document.querySelector("#target");
    const manager = new WindowManager(container, createDelegatorStub(), {
      config: { maxWindows: 0 },
    });

    await expect(manager.open("test")).rejects.toThrow();

    const toast = document.querySelector(
      '[nd-toast-stack] .nd-toast[data-type="error"]',
    );
    expect(toast).toBeTruthy();
  });

  test("WindowManager works with toastNotify", async () => {
    const container = document.querySelector("#target");
    const manager = new WindowManager(container, createDelegatorStub(), {
      notify: toastNotify,
      config: { maxWindows: 0 },
    });

    try {
      await manager.open("test");
    } catch (e) {
      // expected
    }

    const toast = document.querySelector(
      '[nd-toast-stack] .nd-toast[data-type="error"]',
    );
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain("Maximum of 0 windows allowed");
  });

  test("WindowManager works with configurable toast notify", async () => {
    const notify = createToastNotify({
      position: "bottom-left",
      closable: false,
      duration: 0,
    });
    const container = document.querySelector("#target");
    const manager = new WindowManager(container, createDelegatorStub(), {
      notify,
      config: { maxWindows: 0 },
    });

    await expect(manager.open("test")).rejects.toThrow();

    const stack = document.querySelector("[nd-toast-stack]");
    const closeButton = document.querySelector(".nd-toast-close");
    expect(stack?.getAttribute("data-position")).toBe("bottom-left");
    expect(closeButton).toBeNull();
  });

  test("NidamApp uses default toast notifier", async () => {
    const app = createNidamApp({
      root: document,
      windowManager: {
        config: { maxWindows: 0 },
      },
    }).initialize();

    const manager = app.getModule("window");
    await expect(manager.open("test")).rejects.toThrow();

    const stack = document.querySelector("[nd-toast-stack]");
    const closeButton = document.querySelector(".nd-toast-close");
    expect(stack?.getAttribute("data-position")).toBe("top-right");
    expect(closeButton).toBeTruthy();
  });
});
