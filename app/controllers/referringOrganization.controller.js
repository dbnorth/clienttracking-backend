import db from "../models/index.js";
import {
  isSuperAdmin,
  orgFkListWhere,
  orgFkRowWhere,
  parseActingOrganizationHeader,
} from "../authorization/tenantScope.js";

const ReferringOrganization = db.referringOrganization;
const Lookup = db.lookup;
const Organization = db.organization;

const listInclude = [
  { model: Lookup, as: "referringOrganizationType", attributes: ["id", "value"] },
  { model: Organization, as: "organization", attributes: ["id", "name"], required: false },
];

const exports = {};

exports.findAll = (req, res) => {
  const where = orgFkListWhere(req);
  if (where === null) {
    return res.send([]);
  }
  ReferringOrganization.findAll({
    where,
    order: [["name", "ASC"]],
    include: listInclude,
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  const where = orgFkRowWhere(req, id);
  if (where === null) {
    return res.status(404).send({ message: `Referring organization with id=${id} not found.` });
  }
  ReferringOrganization.findOne({
    where,
    include: listInclude,
  })
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Referring organization with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.create = (req, res) => {
  const { name, caseWorkerName, phone, referringOrganizationTypeId } = req.body;
  let organizationId = req.user?.organizationId;
  if (isSuperAdmin(req)) {
    if (req.body.organizationId != null && req.body.organizationId !== "") {
      const parsed = parseInt(req.body.organizationId, 10);
      if (Number.isNaN(parsed)) {
        return res.status(400).send({ message: "Invalid organizationId." });
      }
      const acting = parseActingOrganizationHeader(req);
      if (acting != null && parsed !== acting) {
        return res.status(403).send({ message: "organizationId must match the organization you are acting as." });
      }
      organizationId = parsed;
    } else {
      const acting = parseActingOrganizationHeader(req);
      if (acting != null) {
        organizationId = acting;
      }
    }
  }
  if (!organizationId) {
    return res.status(400).send({
      message:
        "Your account must be assigned to an organization to add referring organizations. Superadmins may pass organizationId in the request body or act as an organization via X-Acting-Organization-Id.",
    });
  }
  if (!name?.trim()) {
    return res.status(400).send({ message: "Name is required." });
  }
  ReferringOrganization.create({
    name: name.trim(),
    caseWorkerName: caseWorkerName?.trim() || null,
    phone: phone?.trim() || null,
    referringOrganizationTypeId: referringOrganizationTypeId || null,
    organizationId,
  })
    .then((created) =>
      ReferringOrganization.findByPk(created.id, {
        include: listInclude,
      })
    )
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const id = req.params.id;
  const where = orgFkRowWhere(req, id);
  if (!where) {
    return res.status(404).send({ message: `Cannot update referring organization with id=${id}.` });
  }
  const { name, caseWorkerName, phone, referringOrganizationTypeId } = req.body;
  if (!name?.trim()) {
    return res.status(400).send({ message: "Name is required." });
  }
  ReferringOrganization.update(
    {
      name: name.trim(),
      caseWorkerName: caseWorkerName?.trim() || null,
      phone: phone?.trim() || null,
      referringOrganizationTypeId: referringOrganizationTypeId || null,
    },
    { where }
  )
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Referring organization was updated successfully." });
      else res.send({ message: `Cannot update referring organization with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const id = req.params.id;
  const where = orgFkRowWhere(req, id);
  if (!where) {
    return res.send({ message: `Cannot delete referring organization with id=${id}.` });
  }
  ReferringOrganization.destroy({ where })
    .then((num) => {
      if (num === 1) res.send({ message: "Referring organization was deleted successfully." });
      else res.send({ message: `Cannot delete referring organization with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
