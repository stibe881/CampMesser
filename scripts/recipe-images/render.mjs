import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dishes } from "./dishes.mjs";

const out = "./img";
mkdirSync(out, { recursive: true });
for (const [id, make] of Object.entries(dishes)) {
  const src = make();
  writeFileSync(`${out}/${id}.svg`, src);
  await sharp(Buffer.from(src), { density: 144 })
    .resize(800, 600)
    .webp({ quality: 86 })
    .toFile(
      `${out}/rezept-${id.replace(/-(overnight|glut|pfanne|paeckli|pfaennli)$/, "")}.webp`
    );
  console.log("ok", id);
}
