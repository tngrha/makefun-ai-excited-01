// Murmuration Phoenix — entry for make.fun ai-excited-01.
//
// Copies the prepared image (entry.png, sitting next to this script)
// into the output directory named by MAKEFUN_OUTPUT_DIR
// (default: /output), creating the directory if it is missing.
//
// Before copying, it sanity-checks the image against the competition
// gate: a PNG or JPEG, at most 1024x1024 pixels and at most 1 MiB.

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const destination = join(outputDir, "entry.png");

const MAX_BYTES = 1_048_576; // 1 MiB
const MAX_DIMENSION = 1024;

if (!existsSync(source)) {
  console.error(`error: entry.png not found next to main.ts (${source})`);
  process.exit(1);
}

const bytes = readFileSync(source);
const size = statSync(source).size;

const isPng = bytes.length >= 8 &&
  bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
const isJpeg = bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;

if (!isPng && !isJpeg) {
  console.error("error: entry.png is neither a PNG nor a JPEG");
  process.exit(1);
}

if (size > MAX_BYTES) {
  console.error(`error: entry.png is ${size} bytes, over the 1 MiB gate limit`);
  process.exit(1);
}

// PNG header: width/height are big-endian uint32 at offsets 16 and 20.
// JPEG: walk the segments for the SOF marker carrying the dimensions.
let width: number | null = null;
let height: number | null = null;

if (isPng && bytes.length >= 24) {
  width = bytes.readUInt32BE(16);
  height = bytes.readUInt32BE(20);
} else if (isJpeg) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      height = bytes.readUInt16BE(offset + 5);
      width = bytes.readUInt16BE(offset + 7);
      break;
    }
    offset += 2 + length;
  }
}

if (width === null || height === null) {
  console.error("error: could not read image dimensions from entry.png");
  process.exit(1);
}

if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
  console.error(`error: entry.png is ${width}x${height}, over the 1024x1024 gate limit`);
  process.exit(1);
}

console.log(`entry.png: ${isPng ? "PNG" : "JPEG"} ${width}x${height}, ${size} bytes — within gate limits`);

mkdirSync(outputDir, { recursive: true });
copyFileSync(source, destination);
console.log(`wrote ${destination}`);
