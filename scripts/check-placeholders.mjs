// Lists every placeholder still left before go-live: "[...]" values in lib/business.ts, <Todo> marks
// in the policy pages, and TODO(client) notes. Run `npm run check:placeholders`; exits 1 while any remain.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const targets = ["lib/business.ts", "lib/offer.ts", "app/(legal)", "app/thank-you"];
const re = /"\[[^"\]]+\]"|<Todo>|TODO\(client\)/g;

function* walk(p) {
  if (statSync(p).isDirectory()) for (const n of readdirSync(p)) yield* walk(join(p, n));
  else if (/\.(ts|tsx)$/.test(p) && !p.endsWith("legal-ui.tsx")) yield p;
}

let count = 0;
for (const t of targets) {
  for (const file of walk(t)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(re)) {
        count++;
        const hint = m[0] === "<Todo>" ? line.slice(m.index + 6).trim() || lines[i + 1]?.trim() : line.trim();
        console.log(`${file}:${i + 1}  ${hint.slice(0, 110)}`);
      }
    });
  }
}
console.log(count ? `\n${count} placeholder(s) left to fill.` : "No placeholders left.");
process.exit(count ? 1 : 0);
