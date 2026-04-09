/**
 * Adds Situation screening booleans on clients (child welfare, foster care, juvenile justice).
 * Run: node app/scripts/addClientSituationScreening.js
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

    const cols = [
      ["childWelfareSystemCase", "TINYINT(1) NOT NULL DEFAULT 0", "currentlyTakingDrugs"],
      ["fosterCareHistory", "TINYINT(1) NOT NULL DEFAULT 0", "childWelfareSystemCase"],
      ["juvenileJusticeHistory", "TINYINT(1) NOT NULL DEFAULT 0", "fosterCareHistory"],
    ];

    let after = (await columnExists("currentlyTakingDrugs")) ? "currentlyTakingDrugs" : null;
    for (const [col, def, afterFallback] of cols) {
      if (await columnExists(col)) {
        console.log(`clients.${col} already exists.`);
        after = col;
        continue;
      }
      const afterCol = after || afterFallback;
      await db.sequelize.query(`ALTER TABLE clients ADD COLUMN ${col} ${def} AFTER ${afterCol}`);
      console.log(`Added clients.${col}`);
      after = col;
    }

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
