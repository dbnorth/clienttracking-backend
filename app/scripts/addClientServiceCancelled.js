/**
 * Adds cancelledDate column and 'cancelled' status to clientservices.
 * Run: node app/scripts/addClientServiceCancelled.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();
    try {
      await db.sequelize.query(
        `ALTER TABLE clientservices ADD COLUMN cancelledDate DATE NULL`
      );
      console.log("Column 'cancelledDate' added.");
    } catch (err) {
      if (err.message?.includes("Duplicate column") || err.code === "ER_DUP_FIELDNAME") {
        console.log("Column 'cancelledDate' already exists.");
      } else throw err;
    }
    try {
      await db.sequelize.query(
        `ALTER TABLE clientservices MODIFY COLUMN status ENUM('requested','provided','cancelled') NOT NULL DEFAULT 'requested'`
      );
      console.log("Status ENUM updated to include 'cancelled'.");
    } catch (err) {
      if (err.message?.includes("Duplicate") || err.message?.includes("already")) {
        console.log("Status ENUM already includes 'cancelled'.");
      } else throw err;
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
