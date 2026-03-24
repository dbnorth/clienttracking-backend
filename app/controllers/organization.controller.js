import db from "../models/index.js";
import path from "path";
import fs from "fs";
import { canAccessOrganizationRecord, isSuperAdmin, organizationTableListWhere } from "../authorization/tenantScope.js";

const Organization = db.organization;
const orgLogosDir = "uploads/organization-logos";

const exports = {};

exports.findAll = (req, res) => {
  const where = organizationTableListWhere(req);
  if (!isSuperAdmin(req) && where === null) {
    return res.send([]);
  }
  Organization.findAll({ where: where || {}, order: [["name", "ASC"]] })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  if (!canAccessOrganizationRecord(req, id)) {
    return res.status(404).send({ message: `Organization with id=${id} not found.` });
  }
  Organization.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Organization with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.create = (req, res) => {
  Organization.create(req.body)
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const id = req.params.id;
  if (!canAccessOrganizationRecord(req, id)) {
    return res.status(404).send({ message: `Cannot update organization with id=${id}.` });
  }
  Organization.update(req.body, { where: { id } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Organization was updated successfully." });
      else res.send({ message: `Cannot update organization with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.uploadLogo = (req, res) => {
  const id = req.params.id;
  if (!canAccessOrganizationRecord(req, id)) {
    return res.status(404).send({ message: `Organization with id=${id} not found.` });
  }
  if (!req.file) {
    return res.status(400).send({ message: "No logo file uploaded." });
  }
  const logoUrl = path.join("organization-logos", req.file.filename).replace(/\\/g, "/");
  Organization.update({ logoUrl }, { where: { id } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Logo uploaded successfully.", logoUrl });
      else res.status(404).send({ message: `Organization with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.removeLogo = (req, res) => {
  const id = req.params.id;
  if (!canAccessOrganizationRecord(req, id)) {
    return res.status(404).send({ message: `Organization with id=${id} not found.` });
  }
  Organization.findByPk(id)
    .then((org) => {
      if (!org) return res.status(404).send({ message: `Organization with id=${id} not found.` });
      if (org.logoUrl) {
        const filePath = path.join(orgLogosDir, path.basename(org.logoUrl));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      return Organization.update({ logoUrl: null }, { where: { id } });
    })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Logo removed successfully." });
      else res.status(404).send({ message: `Organization with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const id = req.params.id;
  if (!canAccessOrganizationRecord(req, id)) {
    return res.status(404).send({ message: `Cannot delete organization with id=${id}.` });
  }
  Organization.destroy({ where: { id } })
    .then((num) => {
      if (num === 1) res.send({ message: "Organization was deleted successfully." });
      else res.send({ message: `Cannot delete organization with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
