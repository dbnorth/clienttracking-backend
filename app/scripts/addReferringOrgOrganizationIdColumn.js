/**
 * Adds organizationId (tenant organization) to referring_organizations.
 * Run: node app/scripts/addReferringOrgOrganizationIdColumn.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [rows] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'referring_organizations' AND COLUMN_NAME = 'organizationId'`
    );

    if (rows.length > 0) {
      console.log("Column 'organizationId' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE referring_organizations ADD COLUMN organizationId INT NULL AFTER referringOrganizationTypeId`
    );
    await db.sequelize.query(
      `ALTER TABLE referring_organizations ADD CONSTRAINT fk_referring_orgs_organization 
       FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE`
    );
    console.log("Column 'organizationId' and foreign key added successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
