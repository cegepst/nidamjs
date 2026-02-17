import WindowRefresher from "../../src/features/window/WindowRefresher.js";

describe("WindowRefresher", () => {
  test("refreshes matching windows", async () => {
    const open = vi.fn();
    const close = vi.fn();

    const win = document.createElement("div");

    const manager = {
      _windows: new Map([["team/12", win]]),
      open,
      close,
    };

    const refresher = new WindowRefresher(manager, {
      refreshTimeout: 0,
      refreshMap: {
        "team:updated": ["team/{id}"],
      },
    });

    refresher.handleEvent("team:updated", { id: "12" });

    await new Promise((r) => setTimeout(r, 0));
    expect(open).toHaveBeenCalledWith("team/12", true, null, false);
    expect(close).not.toHaveBeenCalled();
  });

  test("closes dependent windows on destructive event", async () => {
    const open = vi.fn();
    const close = vi.fn();

    const dependent = document.createElement("div");
    dependent.dataset.dependsOn = "team:42|algo:7";

    const manager = {
      _windows: new Map([["team/42/details", dependent]]),
      open,
      close,
    };

    const refresher = new WindowRefresher(manager, {
      refreshTimeout: 0,
      refreshMap: {},
    });

    refresher.handleEvent("team:deleted", { id: "42" });

    await new Promise((r) => setTimeout(r, 0));
    expect(close).toHaveBeenCalledWith(dependent);
    expect(open).not.toHaveBeenCalled();
  });
});
