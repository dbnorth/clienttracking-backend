/**
 * Adds parentPhone column to clients table.
 * Run: node app/scripts/addClientParentPhone.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'parentPhone'`
    );

    if (cols.length > 0) {
      console.log("Column 'parentPhone' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE clients ADD COLUMN parentPhone VARCHAR(50) NULL AFTER parentLastName`
    );
    console.log("Column 'parentPhone' added to clients table.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
