import db from "../models/index.js";
import bcrypt from "bcryptjs";
import logger from "../config/logger.js";

const User = db.user;
const Organization = db.organization;
const SALT_ROUNDS = 10;

const exports = {};

exports.findAll = (req, res) => {
  User.findAll({
    attributes: ["id", "fName", "lName", "email", "username", "organizationId", "role", "createdAt"],
    include: [{ model: Organization, as: "organization", attributes: ["id", "name"], required: false }],
    order: [["fName", "ASC"], ["lName", "ASC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = parseInt(req.params.id, 10);
  User.findByPk(id, {
    attributes: ["id", "fName", "lName", "email", "username", "organizationId"],
    include: [{ model: Organization, as: "organization", attributes: ["id", "name"], required: false }],
  })
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `User with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.create = async (req, res) => {
  const { fName, lName, email, username, password, organizationId, role } = req.body;
  if (!fName?.trim() || !lName?.trim() || !username?.trim() || !password) {
    return res.status(400).send({ message: "First name, last name, username, and password are required." });
  }
  if (!organizationId) {
    return res.status(400).send({ message: "Organization is required." });
  }
  if (password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }
  if (username.length < 3) {
    return res.status(400).send({ message: "Username must be at least 3 characters." });
  }
  const validRoles = ["admin", "worker", "none"];
  const roleVal = role && validRoles.includes(role) ? role : "worker";
  const emailNorm = email?.trim() ? email.trim().toLowerCase() : null;
  const usernameNorm = username.trim().toLowerCase();
  const Op = db.Sequelize.Op;
  try {
    const conflictWhere = [{ username: usernameNorm }];
    if (emailNorm) conflictWhere.push({ email: emailNorm });
    const conflict = await User.findOne({
      where: { [Op.or]: conflictWhere },
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
      role: roleVal,
    });
    const safe = user.get({ plain: true });
    delete safe.password;
    logger.info(`User created: ${user.username}`);
    res.status(201).send(safe);
  } catch (err) {
    logger.error(`User create error: ${err.message}`);
    res.status(500).send({ message: err.message || "Could not create user." });
  }
};

exports.update = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { fName, lName, email, username, password, organizationId, role } = req.body;
  if (!fName?.trim() || !lName?.trim() || !username?.trim()) {
    return res.status(400).send({ message: "First name, last name, and username are required." });
  }
  if (!organizationId) {
    return res.status(400).send({ message: "Organization is required." });
  }
  if (username.length < 3) {
    return res.status(400).send({ message: "Username must be at least 3 characters." });
  }
  if (password !== undefined && password !== null && password !== "" && password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters if provided." });
  }
  const emailNorm = email?.trim() ? email.trim().toLowerCase() : null;
  const usernameNorm = username.trim().toLowerCase();
  const Op = db.Sequelize.Op;
  try {
    const existing = await User.findByPk(id, { attributes: ["id", "email", "username"] });
    if (!existing) {
      return res.status(404).send({ message: "User not found." });
    }
    const conflictWhere = emailNorm
      ? {
          [Op.and]: [
            { [Op.or]: [{ email: emailNorm }, { username: usernameNorm }] },
            { id: { [Op.ne]: id } },
          ],
        }
      : { username: usernameNorm, id: { [Op.ne]: id } };
    const conflict = await User.findOne({
      where: conflictWhere,
      attributes: ["id"],
    });
    if (conflict) {
      return res.status(400).send({ message: "Email or username is already in use by another user." });
    }
    const validRoles = ["admin", "worker", "none"];
    const updateData = {
      fName: fName.trim(),
      lName: lName.trim(),
      email: emailNorm,
      username: usernameNorm,
      organizationId: organizationId || null,
    };
    if (role && validRoles.includes(role)) updateData.role = role;
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    }
    await User.update(updateData, { where: { id } });
    const updated = await User.findByPk(id, {
      attributes: ["id", "fName", "lName", "email", "username", "organizationId", "role"],
      include: [{ model: Organization, as: "organization", attributes: ["id", "name"], required: false }],
    });
    logger.info(`User updated: ${usernameNorm}`);
    res.send(updated);
  } catch (err) {
    logger.error(`User update error: ${err.message}`);
    res.status(500).send({ message: err.message || "Could not update user." });
  }
};

export default exports;
