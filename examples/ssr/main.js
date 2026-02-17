import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerExampleRoutes } from "./server/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

const distDir = path.resolve(process.cwd(), "dist");
const publicDir = path.resolve(process.cwd(), "examples/ssr/public");

const sendDistAsset = (assetName) => (_req, res, next) => {
  res.sendFile(path.join(distDir, assetName), (err) => {
    if (err) next(err);
  });
};

app.get("/dist/nidam.es.js", sendDistAsset("nidam.es.js"));
app.get("/dist/nidam.css", sendDistAsset("nidam.css"));
app.get("/dist/nidam.umd.js", sendDistAsset("nidam.umd.js"));
app.use("/demo", express.static(publicDir));

registerExampleRoutes(app);

app.listen(port, () => {
  console.log(`NidamJS example running at http://localhost:${port}`);
});
