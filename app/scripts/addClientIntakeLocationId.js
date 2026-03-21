/**
 * Adds intakeLocationId column to clients table.
 * Run: node app/scripts/addClientIntakeLocationId.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'intakeLocationId'`
    );

    if (cols.length > 0) {
      console.log("Column 'intakeLocationId' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE clients ADD COLUMN intakeLocationId INT NULL AFTER organizationId,
       ADD CONSTRAINT fk_clients_intake_location 
       FOREIGN KEY (intakeLocationId) REFERENCES locations(id) ON DELETE SET NULL`
    );
    console.log("Column 'intakeLocationId' added to clients table.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
