/**
 * Adds photoUrl column to clients table.
 * Run: node app/scripts/addClientPhotoUrl.js
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

    if (!existing.includes("photoUrl")) {
      await db.sequelize.query(
        `ALTER TABLE clients ADD COLUMN photoUrl VARCHAR(500) NULL`
      );
      console.log("Column 'photoUrl' added.");
    } else {
      console.log("Column 'photoUrl' already exists.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
