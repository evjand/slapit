#!/usr/bin/env node

/**
 * Migration script to run data migrations after deployment.
 * This script runs the internal migration functions to ensure
 * all data is up to date with the latest schema.
 */

import { spawnSync } from "child_process";

console.log("Running data migrations...");

// Run the totalGamesPlayed migration
const result = spawnSync("npx", ["convex", "run", "migrations:backfillGamesPlayed"], {
  stdio: "inherit",
});

if (result.status === 0) {
  console.log("✅ Migration completed successfully");
} else {
  console.error("❌ Migration failed");
  process.exit(result.status);
}