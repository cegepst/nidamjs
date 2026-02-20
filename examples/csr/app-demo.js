import { createNidamApp } from "../../src/index.js";
import config from "./nidam.config.js"; // We simply import the configuration file!!!

const app = createNidamApp(config);
app.initialize();

console.log("NidamApp successfully initialized via standalone config file: ", config);