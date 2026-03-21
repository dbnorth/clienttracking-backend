/**
 * Adds contactName and phoneNumber columns to organizations table.
 * Run: node app/scripts/addOrganizationContactFields.js
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

    if (!existing.includes("contactName")) {
      await db.sequelize.query(
        `ALTER TABLE organizations ADD COLUMN contactName VARCHAR(255) NULL AFTER name`
      );
      console.log("Column 'contactName' added.");
    }
    if (!existing.includes("phoneNumber")) {
      await db.sequelize.query(
        `ALTER TABLE organizations ADD COLUMN phoneNumber VARCHAR(50) NULL AFTER contactName`
      );
      console.log("Column 'phoneNumber' added.");
    }
    if (existing.includes("contactName") && existing.includes("phoneNumber")) {
      console.log("Columns already exist.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
