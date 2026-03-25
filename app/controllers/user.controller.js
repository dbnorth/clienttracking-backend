import db from "../models/index.js";
import bcrypt from "bcryptjs";
import logger from "../config/logger.js";
import {
  isSuperAdmin,
  parseActingOrganizationHeader,
  userListWhereForActor,
} from "../authorization/tenantScope.js";

const User = db.user;
const Organization = db.organization;
const SALT_ROUNDS = 10;

const exports = {};

exports.findAll = (req, res) => {
  const where = userListWhereForActor(req);
  if (where === null) {
    return res.send([]);
  }
  User.findAll({
    where,
    attributes: ["id", "fName", "lName", "email", "username", "organizationId", "role", "createdAt"],
    include: [{ model: Organization, as: "organization", attributes: ["id", "name"], required: false }],
    order: [["fName", "ASC"], ["lName", "ASC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const scope = userListWhereForActor(req);
  if (!isSuperAdmin(req) && scope === null) {
    return res.status(404).send({ message: `User with id=${id} not found.` });
  }
  const where = { id };
  if (scope && Object.keys(scope).length > 0) {
    Object.assign(where, scope);
  }
  User.findOne({
    where,
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
  let orgId = organizationId;
  if (!isSuperAdmin(req)) {
    const myOrg = req.user?.organizationId;
    if (!myOrg) {
      return res.status(400).send({ message: "Your account must be assigned to an organization to create users." });
    }
    orgId = myOrg;
    if (organizationId != null && parseInt(organizationId, 10) !== myOrg) {
      return res.status(403).send({ message: "You can only create users in your organization." });
    }
  } else {
    const acting = parseActingOrganizationHeader(req);
    if (organizationId != null && organizationId !== "") {
      const parsed = parseInt(organizationId, 10);
      if (Number.isNaN(parsed)) {
        return res.status(400).send({ message: "Invalid organizationId." });
      }
      if (acting != null && parsed !== acting) {
        return res.status(403).send({ message: "You can only create users in the organization you are acting as." });
      }
      orgId = parsed;
    } else if (acting != null) {
      orgId = acting;
    }
  }
  if (!orgId) {
    return res.status(400).send({ message: "Organization is required." });
  }
  if (password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }
  if (username.length < 3) {
    return res.status(400).send({ message: "Username must be at least 3 characters." });
  }
  const assignableRoles =
    req.user?.role === "superadmin" ? ["superadmin", "admin", "worker", "none"] : ["admin", "worker", "none"];
  if (role === "superadmin" && req.user?.role !== "superadmin") {
    return res.status(403).send({ message: "Only a superadmin can assign the superadmin role." });
  }
  const roleVal = role && assignableRoles.includes(role) ? role : "worker";
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
      organizationId: orgId || null,
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
  if (!isSuperAdmin(req) && !organizationId) {
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
    const existing = await User.findByPk(id, { attributes: ["id", "email", "username", "role", "organizationId"] });
    if (!existing) {
      return res.status(404).send({ message: "User not found." });
    }
    if (!isSuperAdmin(req)) {
      const myOrg = req.user?.organizationId;
      if (!myOrg || existing.organizationId !== myOrg) {
        return res.status(404).send({ message: "User not found." });
      }
      if (organizationId != null && parseInt(organizationId, 10) !== myOrg) {
        return res.status(403).send({ message: "You cannot reassign users to another organization." });
      }
    } else {
      const acting = parseActingOrganizationHeader(req);
      if (acting != null && existing.organizationId !== acting) {
        return res.status(404).send({ message: "User not found." });
      }
      if (
        acting != null &&
        organizationId != null &&
        organizationId !== "" &&
        parseInt(organizationId, 10) !== acting
      ) {
        return res.status(403).send({ message: "You cannot reassign users outside the organization you are acting as." });
      }
    }
    if (existing.role === "superadmin" && req.user?.role !== "superadmin") {
      return res.status(403).send({ message: "Only a superadmin can modify superadmin users." });
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
    const assignableRoles =
      req.user?.role === "superadmin" ? ["superadmin", "admin", "worker", "none"] : ["admin", "worker", "none"];
    if (role === "superadmin" && req.user?.role !== "superadmin") {
      return res.status(403).send({ message: "Only a superadmin can assign the superadmin role." });
    }
    let resolvedOrganizationId;
    if (isSuperAdmin(req)) {
      if (organizationId === undefined) {
        resolvedOrganizationId = existing.organizationId;
      } else if (organizationId === null || organizationId === "") {
        resolvedOrganizationId = null;
      } else {
        const p = parseInt(organizationId, 10);
        if (Number.isNaN(p)) {
          return res.status(400).send({ message: "Invalid organizationId." });
        }
        resolvedOrganizationId = p;
      }
    } else {
      resolvedOrganizationId = req.user.organizationId;
    }
    const updateData = {
      fName: fName.trim(),
      lName: lName.trim(),
      email: emailNorm,
      username: usernameNorm,
      organizationId: resolvedOrganizationId,
    };
    if (role && assignableRoles.includes(role)) updateData.role = role;
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

exports.delete = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).send({ message: "Invalid user id." });
  }
  if (req.user?.id === id) {
    return res.status(400).send({ message: "You cannot delete your own account." });
  }
  try {
    const existing = await User.findByPk(id, { attributes: ["id", "role", "organizationId"] });
    if (!existing) {
      return res.status(404).send({ message: `User with id=${id} not found.` });
    }
    if (!isSuperAdmin(req)) {
      const myOrg = req.user?.organizationId;
      if (!myOrg || existing.organizationId !== myOrg) {
        return res.status(404).send({ message: `User with id=${id} not found.` });
      }
    } else {
      const acting = parseActingOrganizationHeader(req);
      if (acting != null && existing.organizationId !== acting) {
        return res.status(404).send({ message: `User with id=${id} not found.` });
      }
    }
    if (existing.role === "superadmin" && req.user?.role !== "superadmin") {
      return res.status(403).send({ message: "Only a superadmin can delete superadmin users." });
    }
    await User.destroy({ where: { id } });
    logger.info(`User deleted: id=${id}`);
    res.send({ message: "User was deleted successfully." });
  } catch (err) {
    logger.error(`User delete error: ${err.message}`);
    res.status(500).send({ message: err.message || "Could not delete user." });
  }
};

export default exports;
