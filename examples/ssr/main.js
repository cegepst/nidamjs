import express from "express";
import path from "node:path";
import { registerExampleRoutes } from "./server/routes.js";

const app = express();
const port = 8080;

const distDir = path.resolve(process.cwd(), "dist");
const publicDir = path.resolve(process.cwd(), "examples/ssr/public");
const sharedDir = path.resolve(process.cwd(), "examples/shared");

const sendDistAsset = (assetName) => (_req, res, next) => {
  res.sendFile(path.join(distDir, assetName), (err) => {
    if (err) next(err);
  });
};

app.get("/dist/nidam.es.js", sendDistAsset("nidam.es.js"));
app.get("/dist/nidam.css", sendDistAsset("nidam.css"));
app.get("/dist/nidam.umd.js", sendDistAsset("nidam.umd.js"));
app.use("/demo", express.static(publicDir));
app.use("/examples/shared", express.static(sharedDir));

registerExampleRoutes(app);

app.listen(port, () => {
  console.log(`NidamJS example running at http://localhost:${port}`);
});
