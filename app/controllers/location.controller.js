import db from "../models/index.js";
import { isSuperAdmin, orgFkListWhere, orgFkRowWhere, sessionTenantScopeWhere } from "../authorization/tenantScope.js";

const Location = db.location;
const Organization = db.organization;

const ATTRS = ["organizationId", "name", "address", "city", "state", "zip", "contactName", "phoneNumber"];

const listWhere = (req) => {
  if (!isSuperAdmin(req)) {
    return sessionTenantScopeWhere(req);
  }
  return orgFkListWhere(req);
};

const exports = {};

exports.findAll = (req, res) => {
  const where = listWhere(req);
  if (!isSuperAdmin(req) && where === null) {
    return res.send([]);
  }
  Location.findAll({
    where: where || {},
    order: [["name", "ASC"]],
    include: [{ model: Organization, as: "organization", attributes: ["id", "name"] }],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  const where = orgFkRowWhere(req, id);
  if (!where) {
    return res.status(404).send({ message: `Location with id=${id} not found.` });
  }
  Location.findOne({
    where,
    include: [{ model: Organization, as: "organization", attributes: ["id", "name"] }],
  })
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Location with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.create = (req, res) => {
  const data = {};
  ATTRS.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (isSuperAdmin(req)) {
    if (data.organizationId == null || data.organizationId === "") {
      return res.status(400).send({ message: "Organization is required." });
    }
    data.organizationId = parseInt(data.organizationId, 10);
    if (Number.isNaN(data.organizationId)) {
      return res.status(400).send({ message: "Invalid organizationId." });
    }
  } else {
    const oid = req.user?.organizationId;
    if (!oid) {
      return res.status(400).send({ message: "Your account must be assigned to an organization." });
    }
    data.organizationId = oid;
  }
  Location.create(data)
    .then((created) => res.send(created))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const where = orgFkRowWhere(req, id);
  if (!where) {
    return res.status(404).send({ message: `Cannot update location with id=${id}.` });
  }
  const data = {};
  ATTRS.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (!isSuperAdmin(req)) {
    delete data.organizationId;
  }
  Location.update(data, { where })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Location was updated successfully." });
      else res.send({ message: `Cannot update location with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const where = orgFkRowWhere(req, id);
  if (!where) {
    return res.status(404).send({ message: `Cannot delete location with id=${id}.` });
  }
  Location.destroy({ where })
    .then((num) => {
      if (num === 1) res.send({ message: "Location was deleted successfully." });
      else res.send({ message: `Cannot delete location with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
