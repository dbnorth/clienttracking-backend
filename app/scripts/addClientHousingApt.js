/**
 * Adds housingApt (apartment / unit) column to clients table.
 * Run: node app/scripts/addClientHousingApt.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'housingApt'`
    );

    if (cols.length > 0) {
      console.log("Column 'housingApt' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE clients ADD COLUMN housingApt VARCHAR(50) NULL AFTER housingStreet`
    );
    console.log("Column 'housingApt' added to clients table.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
