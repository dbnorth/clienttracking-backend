/**
 * Adds time column to encounters table.
 * Run: node app/scripts/addEncounterTimeColumn.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();
    try {
      await db.sequelize.query(`ALTER TABLE encounters ADD COLUMN \`time\` TIME NULL`);
      console.log("Column 'time' added to encounters table.");
    } catch (err) {
      if (err.message?.includes("Duplicate column") || err.code === "ER_DUP_FIELDNAME") {
        console.log("Column 'time' already exists.");
      } else throw err;
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
