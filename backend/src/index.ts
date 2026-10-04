import { createApp } from "./app";
import { config } from "./config";
import { dbPath, store } from "./db";

// Touch the store so first-boot seeding happens before we accept traffic.
const counts = {
  users: store.data.users.length,
  opportunities: store.data.opportunities.length,
};

const app = createApp();
app.listen(config.port, "0.0.0.0", () => {
  console.log(`\n  ▓▓ OppScan API listening on http://localhost:${config.port}`);
  console.log(`  ▓▓ DB: ${dbPath}`);
  console.log(
    `  ▓▓ Seeded: ${counts.users} users · ${counts.opportunities} opportunities\n`,
  );
});
