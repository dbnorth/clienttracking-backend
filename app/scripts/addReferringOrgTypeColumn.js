/**
 * Adds referringOrganizationTypeId column to referring_organizations table.
 * Run: node app/scripts/addReferringOrgTypeColumn.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [rows] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'referring_organizations' AND COLUMN_NAME = 'referringOrganizationTypeId'`
    );

    if (rows.length > 0) {
      console.log("Column 'referringOrganizationTypeId' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE referring_organizations ADD COLUMN referringOrganizationTypeId INT NULL AFTER phone`
    );
    console.log("Column 'referringOrganizationTypeId' added successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
