// Runs before `next build`: writes WebP copies of every image in public/media to public/_img/<width>/<path>.webp
// (the widths lib/image-loader.ts asks for). Already-written files are skipped, so rebuilds are quick.
// Fails the build if sharp can't run: a deploy with missing images is worse than a failed deploy
// (Cloudflare keeps the previous version live).
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";

const WIDTHS = [128, 256, 384, 640, 828, 1080, 1600];
const SRC = join(process.cwd(), "public", "media");
const OUT = join(process.cwd(), "public", "_img");

function* images(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* images(p);
    else if (/\.(jpe?g|png|webp)$/i.test(name)) yield p;
  }
}

sharp.concurrency(2); // gentle on laptops and build machines
let written = 0;
let skipped = 0;
for (const file of images(SRC)) {
  const rel = "/media/" + relative(SRC, file).split("\\").join("/");
  const meta = await sharp(file).metadata();
  for (const w of WIDTHS) {
    const out = join(OUT, String(w), `${rel}.webp`);
    if (existsSync(out) && statSync(out).mtimeMs >= statSync(file).mtimeMs) {
      skipped++;
      continue;
    }
    mkdirSync(dirname(out), { recursive: true });
    await sharp(file)
      .resize({ width: Math.min(w, meta.width ?? w), withoutEnlargement: true })
      .webp({ quality: 76 })
      .toFile(out);
    written++;
  }
}
console.log(`images: ${written} written, ${skipped} up to date`);
