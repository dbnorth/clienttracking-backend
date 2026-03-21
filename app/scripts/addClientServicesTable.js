/**
 * Creates clientservices table.
 * Run: node app/scripts/addClientServicesTable.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [tables] = await db.sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientservices'`
    );

    if (tables.length > 0) {
      console.log("Table 'clientservices' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(`
      CREATE TABLE clientservices (
        id INT NOT NULL AUTO_INCREMENT,
        clientId INT NOT NULL,
        locationId INT NOT NULL,
        encounterRequestedId INT NULL,
        requestedDate DATE NULL,
        encounterProvidedId INT NULL,
        providedDate DATE NULL,
        status ENUM('requested', 'provided') NOT NULL DEFAULT 'requested',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (locationId) REFERENCES locations(id) ON DELETE CASCADE,
        FOREIGN KEY (encounterRequestedId) REFERENCES encounters(id) ON DELETE SET NULL,
        FOREIGN KEY (encounterProvidedId) REFERENCES encounters(id) ON DELETE SET NULL
      )
    `);
    console.log("Table 'clientservices' created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
