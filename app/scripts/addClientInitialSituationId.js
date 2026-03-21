/**
 * Adds initialSituationId column to clients table.
 * Run: node app/scripts/addClientInitialSituationId.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'initialSituationId'`
    );

    if (cols.length > 0) {
      console.log("Column 'initialSituationId' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE clients ADD COLUMN initialSituationId INT NULL AFTER genderId,
       ADD CONSTRAINT fk_clients_initial_situation FOREIGN KEY (initialSituationId) REFERENCES lookups(id) ON DELETE SET NULL`
    );
    console.log("Column 'initialSituationId' added to clients table.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
