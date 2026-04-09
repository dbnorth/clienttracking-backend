/**
 * Adds clients.everInJailOrPrison (Situation screening).
 * Run: node app/scripts/addClientEverInJailOrPrison.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function columnExists(column) {
  const [rows] = await db.sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = ?`,
    { replacements: [column] }
  );
  return rows.length > 0;
}

async function run() {
  try {
    await db.sequelize.authenticate();
    if (await columnExists("everInJailOrPrison")) {
      console.log("clients.everInJailOrPrison already exists.");
      process.exit(0);
      return;
    }
    const after = (await columnExists("juvenileJusticeHistory")) ? "juvenileJusticeHistory" : "currentlyTakingDrugs";
    await db.sequelize.query(
      `ALTER TABLE clients ADD COLUMN everInJailOrPrison TINYINT(1) NOT NULL DEFAULT 0 AFTER ${after}`
    );
    console.log("Added clients.everInJailOrPrison");
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
