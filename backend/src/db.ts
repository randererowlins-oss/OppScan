import fs from "node:fs";
import path from "node:path";
import { config } from "./config";
import type { DatabaseShape } from "./types";
import { seedDatabase } from "./seed";

/**
 * ─── Tiny JSON document store ────────────────────────────────────
 * Why JSON and not Postgres/SQLite?
 *  • Zero external services → `npm run dev` works instantly on any machine,
 *    in CI, and in sandboxed previews.
 *  • The access pattern (small collections, single-writer) fits perfectly.
 *  • Every read/write goes through this module, so swapping in Postgres
 *    later means changing ONE file. See `docs/DATABASE.md` § "Going to
 *    production" for the migration recipe.
 *
 * Concurrency: Node is single-threaded; writes are synchronous and atomic
 * (write tmp file → rename), so readers never see a half-written DB.
 */

const DB_PATH = path.resolve(config.dbFile);

function emptyDb(): DatabaseShape {
  return {
    version: 1,
    users: [],
    opportunities: [],
    saved: [],
    sources: [],
    scans: [],
  };
}

function readFromDisk(): DatabaseShape | null {
  try {
    if (!fs.existsSync(DB_PATH)) return null;
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as DatabaseShape;
    if (parsed.version !== 1 || !Array.isArray(parsed.users)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeToDisk(db: DatabaseShape): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH); // atomic on POSIX
}

class Store {
  private db: DatabaseShape;

  constructor() {
    this.db = readFromDisk() ?? seedDatabase();
    // Persist immediately on first boot so operators can inspect the file.
    writeToDisk(this.db);
  }

  /** Direct (mutable) access — call `save()` after mutating. */
  get data(): DatabaseShape {
    return this.db;
  }

  save(): void {
    writeToDisk(this.db);
  }

  /** Wipe + reseed (used by `npm run seed` and tests). */
  reset(): DatabaseShape {
    this.db = seedDatabase();
    writeToDisk(this.db);
    return this.db;
  }
}

export const store = new Store();
export const dbPath = DB_PATH;
