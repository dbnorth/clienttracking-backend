/**
 * Adds the status column to the lookups table via raw SQL.
 * Run: node app/scripts/addStatusColumn.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [rows] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lookups' AND COLUMN_NAME = 'status'`
    );

    if (rows.length > 0) {
      console.log("Column 'status' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE lookups ADD COLUMN status VARCHAR(20) DEFAULT 'Active' AFTER sortOrder`
    );
    console.log("Column 'status' added successfully.");

    await db.sequelize.query(`UPDATE lookups SET status = 'Active' WHERE status IS NULL`);
    console.log("Existing rows set to Active.");

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
