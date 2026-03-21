/**
 * Migrates organizations table to referring_organizations.
 * Run BEFORE starting the server: node app/scripts/migrateToReferringOrgs.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    const [tables] = await db.sequelize.query(
      "SHOW TABLES LIKE 'organizations'"
    );
    if (tables.length === 0) {
      console.log("No organizations table found. Nothing to migrate.");
      process.exit(0);
      return;
    }

    const [refTables] = await db.sequelize.query(
      "SHOW TABLES LIKE 'referring_organizations'"
    );
    if (refTables.length > 0) {
      console.log("referring_organizations already exists. Migration done.");
      process.exit(0);
      return;
    }

    await db.sequelize.query("RENAME TABLE organizations TO referring_organizations");
    console.log("Renamed organizations -> referring_organizations.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
