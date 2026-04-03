/**
 * Adds daytime location lookup FK and optional "Other" description on clients.
 * Run: node app/scripts/addClientDaytimeLocation.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'daytimeLocationId'`
    );

    if (cols.length > 0) {
      console.log("Columns daytimeLocationId / daytimeLocationOther already exist.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE clients ADD COLUMN daytimeLocationId INT NULL AFTER housingLocationId`
    );
    await db.sequelize.query(
      `ALTER TABLE clients ADD COLUMN daytimeLocationOther VARCHAR(500) NULL AFTER daytimeLocationId`
    );
    await db.sequelize.query(`
      ALTER TABLE clients
      ADD CONSTRAINT clients_daytimeLocation_fk
      FOREIGN KEY (daytimeLocationId) REFERENCES lookups(id) ON DELETE SET NULL
    `);
    console.log("Added daytimeLocationId and daytimeLocationOther to clients.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
