import db from "../models/index.js";
import authconfig from "../config/auth.config.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import logger from "../config/logger.js";

const User = db.user;
const Session = db.session;
const Organization = db.organization;
const Op = db.Sequelize.Op;

const SALT_ROUNDS = 10;

const sendAuthPayload = (res, user, token) => {
  const payload = {
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    userId: user.id,
    username: user.username,
    organizationId: user.organizationId,
    organization: user.organization || null,
    role: user.role || "worker",
    token,
  };
  res.send(payload);
};

const createOrReuseSession = async (user, res) => {
  const email = user.email;

  const existing = await Session.findOne({
    where: { email, token: { [Op.ne]: "" } },
  });

  if (existing) {
    const session = existing.dataValues;
    if (session.expirationDate >= Date.now()) {
      return sendAuthPayload(res, user, session.token);
    }
    await Session.update({ token: "" }, { where: { id: session.id } });
  }

  const token = jwt.sign({ id: email, sub: user.id }, authconfig.secret, { expiresIn: 86400 });
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 1);

  await Session.create({ token, email, expirationDate, userId: user.id });
  sendAuthPayload(res, user, token);
};

const exports = {};

exports.register = async (req, res) => {
  const { fName, lName, email, username, password, organizationId } = req.body;

  if (!fName?.trim() || !lName?.trim() || !email?.trim() || !username?.trim() || !password) {
    return res.status(400).send({ message: "All fields are required." });
  }
  if (password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }
  if (username.length < 3) {
    return res.status(400).send({ message: "Username must be at least 3 characters." });
  }

  const emailNorm = email.trim().toLowerCase();
  const usernameNorm = username.trim().toLowerCase();

  try {
    const conflict = await User.findOne({
      where: {
        [Op.or]: [{ email: emailNorm }, { username: usernameNorm }],
      },
      attributes: ["id"],
    });
    if (conflict) {
      return res.status(400).send({ message: "Email or username is already in use." });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      fName: fName.trim(),
      lName: lName.trim(),
      email: emailNorm,
      username: usernameNorm,
      password: hash,
      organizationId: organizationId || null,
      role: "none",
    });

    logger.info(`User registered: ${user.username}`);
    const safe = user.get({ plain: true });
    delete safe.password;
    res.status(201).send(safe);
  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    res.status(500).send({ message: err.message || "Could not create user." });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password) {
    return res.status(400).send({ message: "Username and password are required." });
  }

  const usernameNorm = username.trim().toLowerCase();
  logger.debug(`Login attempt for username: ${usernameNorm}`);

  try {
    const user = await User.unscoped().findOne({
      where: { username: usernameNorm },
      attributes: ["id", "username", "password", "email", "fName", "lName", "organizationId", "role"],
      include: [{ model: Organization, as: "organization", attributes: ["id", "name", "contactName", "phoneNumber"], required: false }],
    });

    if (!user) {
      logger.warn(`Login failed: no user found for username ${usernameNorm}`);
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const hasHash = !!user.password;
    if (!hasHash) {
      logger.warn(`Login failed: user ${usernameNorm} has no password hash (old schema?)`);
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      logger.warn(`Login failed: password mismatch for username ${usernameNorm}`);
      return res.status(401).send({ message: "Invalid username or password." });
    }

    await createOrReuseSession(user, res);
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).send({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).send({ message: "Password reset is disabled in production." });
  }
  const { username, newPassword } = req.body;
  if (!username?.trim() || !newPassword || newPassword.length < 8) {
    return res.status(400).send({ message: "Username and new password (min 8 chars) are required." });
  }
  const usernameNorm = username.trim().toLowerCase();
  try {
    const user = await User.unscoped().findOne({
      where: { username: usernameNorm },
      attributes: ["id", "username", "password"],
    });
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.update({ password: hash }, { where: { id: user.id } });
    logger.info(`Password reset for user: ${usernameNorm}`);
    res.send({ message: "Password updated. You can sign in with the new password." });
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).send({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  if (req.body === null) {
    res.send({ message: "User has already been successfully logged out!" });
    return;
  }
  let session = {};
  try {
    const rows = await Session.findAll({ where: { token: req.body.token } });
    if (rows[0]) session = rows[0].dataValues;
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
  if (session.id !== undefined) {
    await Session.update({ token: "" }, { where: { id: session.id } });
    res.send({ message: "User has been successfully logged out!" });
  } else {
    res.send({ message: "User has already been successfully logged out!" });
  }
};

export default exports;
