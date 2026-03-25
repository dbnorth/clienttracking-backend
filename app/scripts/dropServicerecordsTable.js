/**
 * Drops legacy servicerecords table (replaced by clientservices for service tracking).
 * Run: node app/scripts/dropServicerecordsTable.js
 */
import "dotenv/config";
import sequelize from "../config/sequelizeInstance.js";

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query("DROP TABLE IF EXISTS servicerecords");
    console.log("Dropped table servicerecords (if it existed).");
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
