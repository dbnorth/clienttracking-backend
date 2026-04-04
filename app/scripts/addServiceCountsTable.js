/**
 * Creates service_counts table (aggregate counts by service lookup, date, location).
 * Run: node app/scripts/addServiceCountsTable.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [tables] = await db.sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_counts'`
    );

    if (tables.length > 0) {
      console.log("Table 'service_counts' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(`
      CREATE TABLE service_counts (
        id INT NOT NULL AUTO_INCREMENT,
        locationId INT NOT NULL,
        serviceProvidedId INT NOT NULL,
        countDate DATE NOT NULL,
        count INT NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_service_count_loc_svc_date (locationId, serviceProvidedId, countDate),
        KEY locationId (locationId),
        KEY serviceProvidedId (serviceProvidedId),
        KEY countDate (countDate),
        CONSTRAINT service_counts_location_fk FOREIGN KEY (locationId) REFERENCES locations (id) ON DELETE CASCADE,
        CONSTRAINT service_counts_lookup_fk FOREIGN KEY (serviceProvidedId) REFERENCES lookups (id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Table 'service_counts' created.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
