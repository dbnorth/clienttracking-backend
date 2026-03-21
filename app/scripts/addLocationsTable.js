/**
 * Creates locations table.
 * Run: node app/scripts/addLocationsTable.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [tables] = await db.sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'locations'`
    );

    if (tables.length > 0) {
      console.log("Table 'locations' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(`
      CREATE TABLE locations (
        id INT NOT NULL AUTO_INCREMENT,
        organizationId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500),
        contactName VARCHAR(255),
        phoneNumber VARCHAR(50),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);
    console.log("Table 'locations' created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
