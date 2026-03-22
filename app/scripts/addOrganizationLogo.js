/**
 * Adds logoUrl column to organizations table.
 * Run: node app/scripts/addOrganizationLogo.js
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

    if (!existing.includes("logoUrl")) {
      await db.sequelize.query(
        `ALTER TABLE organizations ADD COLUMN logoUrl VARCHAR(500) NULL AFTER zip`
      );
      console.log("Column 'logoUrl' added.");
    } else {
      console.log("Column 'logoUrl' already exists.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
