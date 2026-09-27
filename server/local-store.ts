import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { LocalStore } from "./buyers";

// Node-only: keeps the already-paid list (server/buyers.ts) in a small JSON file when Firestore isn't set up,
// so it survives restarts, `git pull` and rebuilds. Holds only hashed ids and order ids, never emails or phones.
// The folder is `data/` next to package.json (gitignored), or DATA_DIR if set.

export function createFileStore(dir: string): LocalStore & { file: string } {
  const file = path.join(dir, "paid-contacts.json");
  return {
    file,
    load() {
      if (!existsSync(file)) return [];
      try {
        const data = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
        return Object.entries(data).filter((e): e is [string, string] => typeof e[1] === "string");
      } catch (err) {
        // Never overwrite a file we couldn't read: keep it aside for a person to look at.
        const aside = `${file}.unreadable-${Date.now()}`;
        try {
          renameSync(file, aside);
        } catch {}
        console.error("[buyers] couldn't read the already-paid file, moved it to", aside, (err as Error).message);
        return [];
      }
    },
    save(entries) {
      try {
        mkdirSync(dir, { recursive: true });
        const tmp = `${file}.tmp`;
        writeFileSync(tmp, JSON.stringify(Object.fromEntries(entries)));
        renameSync(tmp, file); // all or nothing: a crash mid-write never leaves half a file
      } catch (err) {
        console.error("[buyers] couldn't save the already-paid file", file, (err as Error).message);
      }
    },
  };
}

export const dataDir = () => process.env.DATA_DIR?.trim() || path.join(process.cwd(), "data");
