/**
 * Adds housing address snapshot columns on encounters (for edit/view; not synced from encounter update to client).
 * Run: node app/scripts/addEncounterHousingAddress.js (uses AFTER phone if present, else AFTER daytimeLocationId)
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
    let afterCol = (await columnExists("encounters", "phone")) ? "phone" : "daytimeLocationId";
    const cols = [
      ["housingStreet", "VARCHAR(255) NULL"],
      ["housingApt", "VARCHAR(50) NULL"],
      ["housingCity", "VARCHAR(100) NULL"],
      ["housingState", "VARCHAR(50) NULL"],
      ["housingZip", "VARCHAR(20) NULL"],
    ];
    for (const [col, def] of cols) {
      if (await columnExists("encounters", col)) {
        console.log(`encounters.${col} already exists.`);
        afterCol = col;
        continue;
      }
      await db.sequelize.query(`ALTER TABLE encounters ADD COLUMN ${col} ${def} AFTER ${afterCol}`);
      console.log(`Added encounters.${col}`);
      afterCol = col;
    }
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
