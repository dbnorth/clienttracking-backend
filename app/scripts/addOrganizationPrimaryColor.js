/**
 * Adds primaryColor column to organizations table.
 * Run: node app/scripts/addOrganizationPrimaryColor.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organizations'`
    );
    const existing = cols.map((c) => c.COLUMN_NAME);

    if (!existing.includes("primaryColor")) {
      await db.sequelize.query(
        `ALTER TABLE organizations ADD COLUMN primaryColor VARCHAR(20) NULL AFTER logoUrl`
      );
      console.log("Column 'primaryColor' added.");
    } else {
      console.log("Column 'primaryColor' already exists.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
