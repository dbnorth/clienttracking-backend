/**
 * Adds organizationId (tenant) to lookups.
 * Run: node app/scripts/addLookupOrganizationIdColumn.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lookups' AND COLUMN_NAME = 'organizationId'`
    );

    if (cols.length > 0) {
      console.log("Column 'organizationId' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE lookups ADD COLUMN organizationId INT NULL AFTER status`
    );

    const [orgs] = await db.sequelize.query(`SELECT id FROM organizations ORDER BY id ASC LIMIT 1`);
    if (orgs.length > 0) {
      const firstId = orgs[0].id;
      await db.sequelize.query(`UPDATE lookups SET organizationId = ? WHERE organizationId IS NULL`, {
        replacements: [firstId],
      });
      console.log(`Backfilled organizationId to ${firstId} for existing lookups.`);
    } else {
      console.log("No organizations table rows; organizationId left NULL on existing lookups.");
    }

    await db.sequelize.query(
      `ALTER TABLE lookups ADD CONSTRAINT fk_lookups_organization 
       FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE`
    );
    console.log("Foreign key fk_lookups_organization added.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
