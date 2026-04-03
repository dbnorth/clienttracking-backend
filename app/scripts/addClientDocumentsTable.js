/**
 * Creates client_documents table for per-client uploaded documents.
 * Run: node app/scripts/addClientDocumentsTable.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [tables] = await db.sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_documents'`
    );

    if (tables.length > 0) {
      console.log("Table 'client_documents' already exists.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(`
      CREATE TABLE client_documents (
        id INT NOT NULL AUTO_INCREMENT,
        clientId INT NOT NULL,
        documentType ENUM('drivers_license','birth_certificate','social_security_card','misc') NOT NULL,
        miscDescription VARCHAR(500) NULL,
        filePath VARCHAR(500) NOT NULL,
        originalFilename VARCHAR(255) NULL,
        mimeType VARCHAR(100) NULL,
        dateAdded DATE NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        PRIMARY KEY (id),
        KEY clientId (clientId),
        CONSTRAINT client_documents_client_fk FOREIGN KEY (clientId) REFERENCES clients (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Table 'client_documents' created.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
