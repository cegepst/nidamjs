import { renderHomePage } from "./templates/layout.js";
import {
  renderPageOneWindow,
  renderPageTwoWindow,
} from "./templates/windows.js";

export function registerExampleRoutes(app) {
  app.get("/", (_req, res) => {
    res.type("html").send(renderHomePage());
  });

  app.get("/page-one", (_req, res) => {
    res.type("html").send(renderPageOneWindow());
  });

  app.get("/page-two", (_req, res) => {
    res.type("html").send(renderPageTwoWindow());
  });
}
