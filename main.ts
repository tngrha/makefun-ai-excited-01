// Murmuration Phoenix — entry for make.fun ai-excited-01.
// Copies the pre-rendered image entry.png into the output directory
// named by MAKEFUN_OUTPUT_DIR (default /output).
// Node 22, standard library only.

import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Gate limits for ai-excited-01: at most 1024x1024 px and 1 MiB.
const MAX_BYTES = 1048576;

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");

if (!existsSync(source)) {
  console.error(`error: entry.png not found next to main.ts (${source})`);
  process.exit(1);
}

// Sanity check: the file must be a PNG or JPEG image and fit the gate.
const head = new Uint8Array(8);
const fd = openSync(source, "r");
readSync(fd, head, 0, 8, 0);
closeSync(fd);
const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
if (!isPng && !isJpeg) {
  console.error("error: entry.png is neither PNG nor JPEG (bad magic bytes)");
  process.exit(1);
}
const size = statSync(source).size;
if (size > MAX_BYTES) {
  console.error(`error: entry.png is ${size} bytes, over the 1 MiB gate limit`);
  process.exit(1);
}
console.log(`entry.png OK: ${isPng ? "PNG" : "JPEG"}, ${size} bytes`);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });

const dest = join(outDir, "entry.png");
copyFileSync(source, dest);
console.log(`wrote ${dest}`);
