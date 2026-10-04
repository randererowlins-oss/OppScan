/**
 * `npm run seed` — wipe the JSON database and regenerate demo content.
 * Safe to run any time in development; never run against production data.
 */
import { dbPath, store } from "./db";

const db = store.reset();
console.log(`Seeded ${dbPath}`);
console.log(`  users:         ${db.users.length}`);
console.log(`  opportunities: ${db.opportunities.length}`);
console.log(`  sources:       ${db.sources.length}`);
console.log(`\nDemo logins:`);
console.log(`  admin@oppscan.io / admin123   (admin)`);
console.log(`  demo@oppscan.io  / demo1234   (member)`);
