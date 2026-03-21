/**
 * Adds role column to users table.
 * Run: node app/scripts/addUserRole.js
 */
import "dotenv/config";
import db from "../models/index.js";

async function run() {
  try {
    await db.sequelize.authenticate();
    try {
      await db.sequelize.query(
        `ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'worker'`
      );
      console.log("Column 'role' added.");
    } catch (err) {
      if (err.message?.includes("Duplicate column") || err.code === "ER_DUP_FIELDNAME") {
        console.log("Column 'role' already exists.");
      } else throw err;
    }
    try {
      const [[{ minId }]] = await db.sequelize.query(
        `SELECT MIN(id) as minId FROM users`
      );
      if (minId) {
        await db.sequelize.query(`UPDATE users SET role = 'admin' WHERE id = ?`, {
          replacements: [minId],
        });
        console.log("First user set as admin.");
      }
    } catch (err) {
      console.log("Could not set admin:", err.message);
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
