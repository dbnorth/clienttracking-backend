import db from "../models/index.js";
import logger from "../config/logger.js";
import path from "path";
import fs from "fs";
import { getClientTenantScope } from "../authorization/tenantScope.js";
import { clientAccessibleForScope } from "../authorization/clientAccess.js";

const Client = db.client;
const clientPhotosDir = "uploads/client-photos";
const Referral = db.referral;
const Op = db.Sequelize.Op;
const Lookup = db.lookup;
const ReferringOrganization = db.referringOrganization;
const Location = db.location;

const exports = {};

exports.create = async (req, res) => {
  const scope = getClientTenantScope(req);
  if (scope.mode === "none") {
    return res.status(403).send({ message: "You must belong to an organization to create clients." });
  }
  const data = { ...req.body };
  const referralCaseWorker = data.referralCaseWorker;
  const referralPhone = data.referralPhone;
  delete data.referralCaseWorker;
  delete data.referralPhone;

  if (!data.dateOfFirstContact) data.dateOfFirstContact = new Date().toISOString().split("T")[0];
  if (!data.statusChangeDate && data.status) data.statusChangeDate = new Date().toISOString().split("T")[0];
  if (Array.isArray(data.benefits)) data.benefits = JSON.stringify(data.benefits);
  data.userId = req.body.userId;

  if (scope.mode === "scoped" && data.intakeLocationId) {
    try {
      const loc = await Location.findByPk(data.intakeLocationId, { attributes: ["id", "organizationId"] });
      if (!loc) {
        return res.status(400).send({ message: "Invalid intake location." });
      }
      if (Number(loc.organizationId) !== Number(scope.organizationId)) {
        return res.status(403).send({ message: "Intake location must belong to your organization." });
      }
    } catch (err) {
      logger.error(`Error validating intake location: ${err.message}`);
      return res.status(500).send({ message: err.message || "Could not validate intake location." });
    }
  } else if (scope.mode === "scoped" && !data.intakeLocationId) {
    return res.status(400).send({ message: "Intake location is required for your organization." });
  }

  Client.create(data)
    .then((result) => {
      if (data.organizationId && result.id) {
        const dateOfReferral = data.dateOfFirstContact || new Date().toISOString().split("T")[0];
        return Referral.create({
          referringOrganizationId: data.organizationId,
          clientId: result.id,
          caseWorkerName: referralCaseWorker || null,
          phone: referralPhone || null,
          dateOfReferral,
        }).then(() => result);
      }
      return result;
    })
    .then((result) => res.send(result))
    .catch((err) => {
      logger.error(`Error creating client: ${err.message}`);
      res.status(500).send({ message: err.message || "Error creating client." });
    });
};

exports.findAll = (req, res) => {
  const scope = getClientTenantScope(req);
  if (scope.mode === "none") {
    return res.send([]);
  }

  const userId = req.query.userId;
  const organizationId = req.query.organizationId ? parseInt(req.query.organizationId, 10) : null;
  const status = req.query.status;
  const name = req.query.name?.trim();
  const phone = req.query.phone?.trim();
  const intakeLocationId = req.query.intakeLocationId ? parseInt(req.query.intakeLocationId, 10) : null;
  const housingLocationId = req.query.housingLocationId ? parseInt(req.query.housingLocationId, 10) : null;

  const andConditions = [];
  if (scope.mode === "scoped") {
    andConditions.push({ "$intakeLocation.organizationId$": scope.organizationId });
    if (userId) {
      andConditions.push({ userId });
    }
  } else if (organizationId) {
    andConditions.push({ "$intakeLocation.organizationId$": organizationId });
  } else if (userId) {
    andConditions.push({ userId });
  }
  if (status) andConditions.push({ status });
  if (intakeLocationId) andConditions.push({ intakeLocationId });
  if (housingLocationId) andConditions.push({ housingLocationId });
  if (name || phone) {
    const orConditions = [];
    if (name) {
      orConditions.push(
        { firstName: { [Op.like]: `%${name}%` } },
        { lastName: { [Op.like]: `%${name}%` } },
        { middleName: { [Op.like]: `%${name}%` } }
      );
    }
    if (phone) {
      orConditions.push({ phone: { [Op.like]: `%${phone}%` } });
    }
    andConditions.push({ [Op.or]: orConditions });
  }
  const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};

  Client.findAll({
    where,
    include: [
      { model: Lookup, as: "referralType", attributes: ["id", "value"] },
      { model: Lookup, as: "drugOfChoice", attributes: ["id", "value"] },
      { model: Lookup, as: "housingType", attributes: ["id", "value"] },
      { model: Lookup, as: "housingLocation", attributes: ["id", "value"] },
      { model: Lookup, as: "race", attributes: ["id", "value"] },
      { model: Lookup, as: "ethnicity", attributes: ["id", "value"] },
      { model: Lookup, as: "gender", attributes: ["id", "value"] },
      { model: Lookup, as: "initialSituation", attributes: ["id", "value"] },
      { model: ReferringOrganization, as: "organization", attributes: ["id", "name", "caseWorkerName", "phone"] },
      {
        model: Location,
        as: "intakeLocation",
        attributes: ["id", "name", "address", "organizationId"],
        include: [{ model: db.organization, as: "organization", attributes: ["id", "name"] }],
      },
    ],
  })
    .then((data) => res.send(data))
    .catch((err) => {
      logger.error(`Error retrieving clients: ${err.message}`);
      res.status(500).send({ message: err.message });
    });
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  Client.findByPk(id, {
    include: [
      { model: Lookup, as: "referralType", attributes: ["id", "value"] },
      { model: Lookup, as: "drugOfChoice", attributes: ["id", "value"] },
      { model: Lookup, as: "housingType", attributes: ["id", "value"] },
      { model: Lookup, as: "housingLocation", attributes: ["id", "value"] },
      { model: Lookup, as: "race", attributes: ["id", "value"] },
      { model: Lookup, as: "ethnicity", attributes: ["id", "value"] },
      { model: Lookup, as: "gender", attributes: ["id", "value"] },
      { model: Lookup, as: "initialSituation", attributes: ["id", "value"] },
      { model: ReferringOrganization, as: "organization", attributes: ["id", "name", "caseWorkerName", "phone"] },
      {
        model: Location,
        as: "intakeLocation",
        attributes: ["id", "name", "address", "organizationId"],
        include: [{ model: db.organization, as: "organization", attributes: ["id", "name"] }],
      },
    ],
  })
    .then((data) => {
      if (data) {
        if (!clientAccessibleForScope(req, data)) {
          return res.status(404).send({ message: `Client with id=${id} not found.` });
        }
        if (data.benefits) {
          try { data.benefits = JSON.parse(data.benefits); } catch (_) {}
        }
        res.send(data);
      } else res.status(404).send({ message: `Client with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

const CLIENT_ATTRS = [
  "firstName", "middleName", "lastName", "suffix", "birthdate", "parentFirstName", "parentLastName", "parentPhone",
  "phone", "emergencyContactName", "emergencyContactPhone", "referralTypeId", "organizationId",
  "intakeLocationId", "raceId", "ethnicityId", "genderId", "initialSituationId", "drugOfChoiceId", "drugMethod", "housingTypeId", "housingRedGreen",
  "housingLocationId", "housingStreet", "housingCity", "housingState", "housingZip",
  "benefits", "status", "statusChangeDate", "dateOfFirstContact", "userId", "photoUrl",
];

exports.update = async (req, res) => {
  const id = req.params.id;
  const existing = await Client.findByPk(id, {
    include: [
      {
        model: Location,
        as: "intakeLocation",
        attributes: ["id", "organizationId"],
        include: [{ model: db.organization, as: "organization", attributes: ["id"] }],
      },
    ],
  });
  if (!existing) {
    return res.status(404).send({ message: `Client with id=${id} not found.` });
  }
  if (!clientAccessibleForScope(req, existing)) {
    return res.status(404).send({ message: `Client with id=${id} not found.` });
  }

  const data = {};
  CLIENT_ATTRS.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (Array.isArray(data.benefits)) data.benefits = JSON.stringify(data.benefits);

  const scope = getClientTenantScope(req);
  if (scope.mode === "scoped" && data.intakeLocationId !== undefined && data.intakeLocationId !== null) {
    const loc = await Location.findByPk(data.intakeLocationId, { attributes: ["organizationId"] });
    if (!loc) {
      return res.status(400).send({ message: "Invalid intake location." });
    }
    if (Number(loc.organizationId) !== Number(scope.organizationId)) {
      return res.status(403).send({ message: "Intake location must belong to your organization." });
    }
  }

  Client.update(data, { where: { id } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Client was updated successfully." });
      else res.send({ message: `Cannot update client with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.uploadPhoto = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!req.file) {
    return res.status(400).send({ message: "No photo file uploaded." });
  }
  const row = await Client.findByPk(id, {
    include: [
      {
        model: Location,
        as: "intakeLocation",
        attributes: ["organizationId"],
        include: [{ model: db.organization, as: "organization", attributes: ["id"] }],
      },
    ],
  });
  if (!row || !clientAccessibleForScope(req, row)) {
    return res.status(404).send({ message: `Client with id=${id} not found.` });
  }
  const photoUrl = path.join("client-photos", req.file.filename).replace(/\\/g, "/");
  Client.update({ photoUrl }, { where: { id } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Photo uploaded successfully.", photoUrl });
      else res.status(404).send({ message: `Client with id=${id} not found.` });
    })
    .catch((err) => {
      logger.error(`Error uploading client photo: ${err.message}`);
      res.status(500).send({ message: err.message || "Error uploading photo." });
    });
};

exports.removePhoto = (req, res) => {
  const id = parseInt(req.params.id, 10);
  Client.findByPk(id, {
    include: [
      {
        model: Location,
        as: "intakeLocation",
        attributes: ["organizationId"],
        include: [{ model: db.organization, as: "organization", attributes: ["id"] }],
      },
    ],
  })
    .then((client) => {
      if (!client) return res.status(404).send({ message: `Client with id=${id} not found.` });
      if (!clientAccessibleForScope(req, client)) {
        return res.status(404).send({ message: `Client with id=${id} not found.` });
      }
      if (client.photoUrl) {
        const filePath = path.join(clientPhotosDir, path.basename(client.photoUrl));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      return Client.update({ photoUrl: null }, { where: { id } });
    })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Photo removed successfully." });
      else res.status(404).send({ message: `Client with id=${id} not found.` });
    })
    .catch((err) => {
      logger.error(`Error removing client photo: ${err.message}`);
      res.status(500).send({ message: err.message || "Error removing photo." });
    });
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  const row = await Client.findByPk(id, {
    include: [
      {
        model: Location,
        as: "intakeLocation",
        attributes: ["organizationId"],
        include: [{ model: db.organization, as: "organization", attributes: ["id"] }],
      },
    ],
  });
  if (!row || !clientAccessibleForScope(req, row)) {
    return res.status(404).send({ message: `Client with id=${id} not found.` });
  }
  Client.destroy({ where: { id } })
    .then((num) => {
      if (num === 1) res.send({ message: "Client was deleted successfully." });
      else res.send({ message: `Cannot delete client with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
