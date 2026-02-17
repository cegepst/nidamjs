import ContentInitializer from "../../src/core/ContentInitializer.js";

describe("ContentInitializer", () => {
  test("initializes matching elements and stores named modules", () => {
    document.body.innerHTML = `
      <div id="root">
        <button data-a></button>
        <button data-a></button>
      </div>
    `;

    const calls = [];
    const modules = new Map();
    const delegator = { id: "delegator" };

    const registry = [
      {
        selector: "[data-a]",
        name: "featureA",
        init: (el) => {
          calls.push(el);
          return { el };
        },
      },
    ];

    ContentInitializer.initialize(delegator, document, modules, registry);

    expect(calls).toHaveLength(2);
    expect(modules.has("featureA")).toBe(true);
  });

  test("does not initialize the same element twice", () => {
    document.body.innerHTML = `<div id="root"><button data-a></button></div>`;

    let count = 0;
    const registry = [
      {
        selector: "[data-a]",
        init: () => {
          count += 1;
        },
      },
    ];

    ContentInitializer.initialize({}, document, new Map(), registry);
    ContentInitializer.initialize({}, document, new Map(), registry);

    expect(count).toBe(1);
  });
});
