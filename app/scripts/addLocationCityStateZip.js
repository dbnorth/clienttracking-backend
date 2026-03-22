/**
 * Adds city, state, zip columns to locations table.
 * Run: node app/scripts/addLocationCityStateZip.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'locations'`
    );
    const existing = cols.map((c) => c.COLUMN_NAME);

    if (!existing.includes("city")) {
      await db.sequelize.query(
        `ALTER TABLE locations ADD COLUMN city VARCHAR(100) NULL AFTER address`
      );
      console.log("Column 'city' added.");
    }
    if (!existing.includes("state")) {
      await db.sequelize.query(
        `ALTER TABLE locations ADD COLUMN state VARCHAR(50) NULL AFTER city`
      );
      console.log("Column 'state' added.");
    }
    if (!existing.includes("zip")) {
      await db.sequelize.query(
        `ALTER TABLE locations ADD COLUMN zip VARCHAR(20) NULL AFTER state`
      );
      console.log("Column 'zip' added.");
    }
    if (existing.includes("city") && existing.includes("state") && existing.includes("zip")) {
      console.log("Columns already exist.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
