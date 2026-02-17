import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const target = process.argv[2];
if (!target) {
  console.error("Usage: bun scripts/openFile.js <path-to-file>");
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), target);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const open = (command, args) =>
  spawnSync(command, args, { stdio: "ignore" }).status === 0;

let ok = false;

if (process.platform === "win32") {
  ok = open("cmd", ["/c", "start", "", filePath]);
} else if (process.platform === "darwin") {
  ok = open("open", [filePath]);
} else {
  ok = open("xdg-open", [filePath]) || open("gio", ["open", filePath]);
}

if (!ok) {
  console.error(`Could not open file: ${filePath}`);
  process.exit(1);
}
