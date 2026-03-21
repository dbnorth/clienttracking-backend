/**
 * Adds genderId column to clients table.
 * Run: node app/scripts/addClientGenderId.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'genderId'`
    );

    if (cols.length > 0) {
      console.log("Column 'genderId' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE clients ADD COLUMN genderId INT NULL AFTER ethnicityId,
       ADD CONSTRAINT fk_clients_gender FOREIGN KEY (genderId) REFERENCES lookups(id) ON DELETE SET NULL`
    );
    console.log("Column 'genderId' added to clients table.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
