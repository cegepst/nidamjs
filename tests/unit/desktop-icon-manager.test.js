import DesktopIconManager from "../../src/features/desktop/DesktopIconManager.js";

const createDelegatorStub = () => ({
  on: vi.fn(),
});

describe("DesktopIconManager", () => {
  test("loads saved layout using injected storage utility", () => {
    document.body.innerHTML = `
      <div id="desktop">
        <div class="desktop-icon col-start-1 row-start-1" data-modal="algo"></div>
        <div class="desktop-icon col-start-2 row-start-1" data-modal="arena"></div>
      </div>
    `;
    const container = document.querySelector("#desktop");
    const delegator = createDelegatorStub();
    const storage = {
      get: vi.fn(() => [
        { id: "algo", classes: ["col-start-4", "row-start-2"] },
      ]),
      set: vi.fn(),
    };

    new DesktopIconManager(container, delegator, { storage });

    const algo = container.querySelector('[data-modal="algo"]');
    const arena = container.querySelector('[data-modal="arena"]');

    expect(storage.get).toHaveBeenCalledWith("desktop_grid_layout", []);
    expect(algo.classList.contains("col-start-4")).toBe(true);
    expect(algo.classList.contains("row-start-2")).toBe(true);
    expect(arena.classList.contains("col-start-2")).toBe(true);
  });

  test("saves layout through storage utility with namespace key", () => {
    document.body.innerHTML = `
      <div id="desktop">
        <div class="desktop-icon col-start-3 row-start-2" data-modal="algo"></div>
        <div class="desktop-icon col-start-1 row-start-1" data-modal="arena"></div>
      </div>
    `;
    const container = document.querySelector("#desktop");
    const delegator = createDelegatorStub();
    const storage = {
      get: vi.fn(() => []),
      set: vi.fn(),
    };

    const manager = new DesktopIconManager(container, delegator, {
      storage,
      storageNamespace: "team42",
    });
    manager._saveLayout();

    expect(storage.set).toHaveBeenCalledWith("team42_desktop_grid_layout", [
      { id: "algo", classes: ["col-start-3", "row-start-2"] },
      { id: "arena", classes: ["col-start-1", "row-start-1"] },
    ]);
  });
});
