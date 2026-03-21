/**
 * Run with: node app/scripts/checkUsers.js
 * Verifies the users table exists, has correct columns, and lists users.
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();
    console.log("DB connected.");

    const [results] = await db.sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION",
      { replacements: [process.env.DB_NAME || "clienttracking"] }
    );
    console.log("\nusers table columns:", results.map((r) => r.COLUMN_NAME).join(", "));

    const [rows] = await db.sequelize.query(
      "SELECT id, username, email, fName, lName, CASE WHEN password IS NULL OR password = '' THEN 'NO' ELSE 'YES' END as has_password FROM users"
    );
    console.log("\nUsers:", rows.length ? rows : "(none)");

    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

run();
