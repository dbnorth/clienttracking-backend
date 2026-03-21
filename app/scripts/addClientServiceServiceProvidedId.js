/**
 * Adds serviceProvidedId to clientservices, makes locationId nullable.
 * Run: node app/scripts/addClientServiceServiceProvidedId.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientservices' AND COLUMN_NAME = 'serviceProvidedId'`
    );

    if (cols.length > 0) {
      console.log("Column 'serviceProvidedId' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(`
      ALTER TABLE clientservices 
        MODIFY COLUMN locationId INT NULL,
        ADD COLUMN serviceProvidedId INT NULL AFTER locationId,
        ADD CONSTRAINT fk_clientservices_service_provided 
          FOREIGN KEY (serviceProvidedId) REFERENCES lookups(id) ON DELETE SET NULL
    `);
    console.log("Column 'serviceProvidedId' added, locationId made nullable.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
