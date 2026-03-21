/**
 * One-time script: set status='Active' on existing lookups with null status.
 * Run after backend has started at least once (so sync adds the column): node app/scripts/addLookupStatus.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    const [result] = await db.sequelize.query(
      "UPDATE lookups SET status = 'Active' WHERE status IS NULL"
    );
    console.log("Updated", result?.affectedRows ?? 0, "lookups to Active.");
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

run();
