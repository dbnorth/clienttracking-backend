/**
 * Adds encounters.phone (snapshot; syncs to clients.phone on save like other snapshot fields).
 * Run: node app/scripts/addEncounterPhone.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function columnExists(table, column) {
  const [rows] = await db.sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return rows.length > 0;
}

async function run() {
  try {
    await db.sequelize.authenticate();
    if (await columnExists("encounters", "phone")) {
      console.log("encounters.phone already exists.");
    } else {
      await db.sequelize.query("ALTER TABLE encounters ADD COLUMN phone VARCHAR(50) NULL AFTER daytimeLocationId");
      console.log("Added encounters.phone");
    }
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
