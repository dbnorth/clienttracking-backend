/**
 * Makes users.email column nullable.
 * Run: node app/scripts/makeUserEmailNullable.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();

    const [cols] = await db.sequelize.query(
      `SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email'`
    );

    if (cols.length === 0) {
      console.log("Column 'email' not found in users table.");
      process.exit(1);
    }
    if (cols[0].IS_NULLABLE === "YES") {
      console.log("Column 'email' is already nullable.");
      process.exit(0);
      return;
    }

    await db.sequelize.query(
      `ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL`
    );
    console.log("Column 'email' is now nullable.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
