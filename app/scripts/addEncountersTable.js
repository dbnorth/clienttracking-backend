/**
 * Creates encounters table.
 * Run: node app/scripts/addEncountersTable.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [tables] = await db.sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'encounters'`
    );

    if (tables.length > 0) {
      console.log("Table 'encounters' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(`
      CREATE TABLE encounters (
        id INT NOT NULL AUTO_INCREMENT,
        date DATE NOT NULL,
        userId INT NOT NULL,
        clientId INT NOT NULL,
        notes TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);
    console.log("Table 'encounters' created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
