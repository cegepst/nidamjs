import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerExampleRoutes } from "./server/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

const srcDir = path.resolve(__dirname, "../../src");
const publicDir = path.resolve(__dirname, "./public");

app.use("/lib", express.static(srcDir));
app.use("/demo", express.static(publicDir));

registerExampleRoutes(app);

app.listen(port, () => {
  console.log(`NidamJS example running at http://localhost:${port}`);
});
