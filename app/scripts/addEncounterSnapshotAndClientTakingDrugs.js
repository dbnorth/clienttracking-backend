/**
 * Adds encounter snapshot columns + clients.currentlyTakingDrugs.
 * Run: node app/scripts/addEncounterSnapshotAndClientTakingDrugs.js
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

    if (!(await columnExists("clients", "currentlyTakingDrugs"))) {
      await db.sequelize.query(
        "ALTER TABLE clients ADD COLUMN currentlyTakingDrugs TINYINT(1) NOT NULL DEFAULT 0 AFTER drugsOfChoice"
      );
      console.log("Added clients.currentlyTakingDrugs");
    } else {
      console.log("clients.currentlyTakingDrugs already exists.");
    }

    const encCols = [
      ["currentSituationId", "INT NULL", "encounterTypeId"],
      ["currentlyTakingDrugs", "TINYINT(1) NOT NULL DEFAULT 0", "currentSituationId"],
      ["housingTypeId", "INT NULL", "currentlyTakingDrugs"],
      ["housingRedGreen", "VARCHAR(20) NULL", "housingTypeId"],
      ["housingLocationId", "INT NULL", "housingRedGreen"],
      ["daytimeLocationId", "INT NULL", "housingLocationId"],
    ];

    for (const [col, def, afterCol] of encCols) {
      if (await columnExists("encounters", col)) {
        console.log(`encounters.${col} already exists.`);
        continue;
      }
      await db.sequelize.query(
        `ALTER TABLE encounters ADD COLUMN ${col} ${def} AFTER ${afterCol}`
      );
      console.log(`Added encounters.${col}`);
    }

    const fks = [
      ["fk_encounters_current_situation", "currentSituationId", "lookups(id)"],
      ["fk_encounters_housing_type", "housingTypeId", "lookups(id)"],
      ["fk_encounters_housing_location", "housingLocationId", "lookups(id)"],
      ["fk_encounters_daytime_location", "daytimeLocationId", "lookups(id)"],
    ];
    for (const [name, col, ref] of fks) {
      try {
        await db.sequelize.query(
          `ALTER TABLE encounters ADD CONSTRAINT ${name} FOREIGN KEY (${col}) REFERENCES ${ref} ON DELETE SET NULL`
        );
        console.log(`Added ${name}`);
      } catch (e) {
        if (String(e.message).includes("Duplicate") || String(e.message).includes("already exists")) {
          console.log(`${name} already exists.`);
        } else {
          throw e;
        }
      }
    }

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
