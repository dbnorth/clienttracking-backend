/**
 * Adds currentSituationId to clients (same lookups as initial_situation; UI "Current Status").
 * Run: node app/scripts/addClientCurrentSituationId.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'currentSituationId'`
    );

    if (cols.length > 0) {
      console.log("Column 'currentSituationId' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE clients ADD COLUMN currentSituationId INT NULL AFTER initialSituationId,
       ADD CONSTRAINT fk_clients_current_situation FOREIGN KEY (currentSituationId) REFERENCES lookups(id) ON DELETE SET NULL`
    );
    console.log("Column 'currentSituationId' added to clients table.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
