/**
 * Adds raceId and ethnicityId columns to clients table.
 * Run: node app/scripts/addClientRaceEthnicity.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients'`
    );
    const existing = cols.map((c) => c.COLUMN_NAME);

    if (!existing.includes("raceId")) {
      await db.sequelize.query(
        `ALTER TABLE clients ADD COLUMN raceId INT NULL AFTER birthdate,
         ADD CONSTRAINT fk_clients_race FOREIGN KEY (raceId) REFERENCES lookups(id) ON DELETE SET NULL`
      );
      console.log("Column 'raceId' added.");
    }
    if (!existing.includes("ethnicityId")) {
      await db.sequelize.query(
        `ALTER TABLE clients ADD COLUMN ethnicityId INT NULL AFTER raceId,
         ADD CONSTRAINT fk_clients_ethnicity FOREIGN KEY (ethnicityId) REFERENCES lookups(id) ON DELETE SET NULL`
      );
      console.log("Column 'ethnicityId' added.");
    }
    if (existing.includes("raceId") && existing.includes("ethnicityId")) {
      console.log("Columns already exist.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
