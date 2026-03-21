/**
 * Test login flow. Usage: node app/scripts/testLogin.js <username> <password>
 * Verifies the user exists and bcrypt.compare works.
 */
import "dotenv/config";
import db from "../models/index.js";
import bcrypt from "bcryptjs";

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.log("Usage: node app/scripts/testLogin.js <username> <password>");
  process.exit(1);
}

const usernameNorm = username.trim().toLowerCase();

async function run() {
  try {
    const user = await db.user.unscoped().findOne({
      where: { username: usernameNorm },
      attributes: ["id", "username", "password", "email"],
    });

    if (!user) {
      console.log("User not found:", usernameNorm);
      process.exit(1);
    }
    console.log("User found:", user.username, "email:", user.email);
    console.log("Password hash length:", user.password?.length || 0);
    console.log("Hash starts with $2:", user.password?.startsWith("$2") || false);

    const match = await bcrypt.compare(password, user.password);
    console.log("Password match:", match);
    process.exit(match ? 0 : 1);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

run();
