/**
 * Adds organizationId column to users table.
 * Run: node app/scripts/addUserOrganizationId.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'organizationId'`
    );

    if (cols.length > 0) {
      console.log("Column 'organizationId' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE users ADD COLUMN organizationId INT NULL AFTER password,
       ADD CONSTRAINT fk_users_organization 
       FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE SET NULL`
    );
    console.log("Column 'organizationId' added to users table.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
