/**
 * Adds encounterTypeId column to encounters table.
 * Run: node app/scripts/addEncounterTypeId.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();
    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'encounters' AND COLUMN_NAME = 'encounterTypeId'`
    );
    if (cols.length > 0) {
      console.log("Column 'encounterTypeId' already exists.");
      process.exit(0);
      return;
    }
    await db.sequelize.query(
      `ALTER TABLE encounters ADD COLUMN encounterTypeId INT NULL,
       ADD CONSTRAINT fk_encounters_encounter_type 
       FOREIGN KEY (encounterTypeId) REFERENCES lookups(id) ON DELETE SET NULL`
    );
    console.log("Column 'encounterTypeId' added to encounters table.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
