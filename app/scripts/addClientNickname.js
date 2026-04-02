/**
 * Adds nickname (goes-by name) column to clients table.
 * Run: node app/scripts/addClientNickname.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'nickname'`
    );

    if (cols.length > 0) {
      console.log("Column 'nickname' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(`ALTER TABLE clients ADD COLUMN nickname VARCHAR(100) NULL AFTER firstName`);
    console.log("Column 'nickname' added to clients table.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
