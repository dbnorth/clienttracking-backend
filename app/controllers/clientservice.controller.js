import db from "../models/index.js";
import logger from "../config/logger.js";

const ClientService = db.clientService;
const Location = db.location;
const Encounter = db.encounter;
const Lookup = db.lookup;

const exports = {};

const ATTRS = [
  "clientId",
  "locationId",
  "serviceProvidedId",
  "encounterRequestedId",
  "requestedDate",
  "encounterProvidedId",
  "providedDate",
  "cancelledDate",
  "status",
];

exports.findAll = (req, res) => {
  const clientId = req.query.clientId ? parseInt(req.query.clientId, 10) : null;
  const serviceProvidedId = req.query.serviceProvidedId ? parseInt(req.query.serviceProvidedId, 10) : null;
  const date = req.query.date?.trim();
  const status = req.query.status?.trim().toLowerCase();
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  const encounterId = req.query.encounterId ? parseInt(req.query.encounterId, 10) : null;
  const Op = db.Sequelize.Op;
  const where = {};
  if (clientId) where.clientId = clientId;
  if (serviceProvidedId) where.serviceProvidedId = serviceProvidedId;
  const validStatuses = ["requested", "provided", "cancelled"];
  if (status && validStatuses.includes(status)) where.status = status;
  const andParts = [];
  if (encounterId) {
    andParts.push({
      [Op.or]: [
        { encounterRequestedId: encounterId },
        { encounterProvidedId: encounterId },
      ],
    });
  }
  if (date) {
    const dateConditions = [
      { requestedDate: date },
      { providedDate: date },
      { cancelledDate: date },
    ];
    andParts.push({ [Op.or]: dateConditions });
  }
  if (andParts.length > 0) where[Op.and] = andParts;
  const include = [
    { model: db.client, as: "client", attributes: ["id", "firstName", "lastName", "middleName", "phone"], required: true },
    { model: Location, as: "location", attributes: ["id", "name", "address"], required: false, include: [{ model: db.organization, as: "organization", attributes: ["id", "name"] }] },
    { model: Lookup, as: "serviceProvided", attributes: ["id", "value"] },
    { model: Encounter, as: "encounterRequested", attributes: ["id", "date", "time", "notes"] },
    { model: Encounter, as: "encounterProvided", attributes: ["id", "date", "time", "notes"] },
  ];
  if (userId) {
    include[0].where = { userId };
  }
  ClientService.findAll({
    where,
    include,
    order: [["requestedDate", "DESC"], ["providedDate", "DESC"], ["cancelledDate", "DESC"], ["id", "DESC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.createBulk = async (req, res) => {
  const clientId = parseInt(req.params.clientId, 10);
  const { items, userId, notes, time } = req.body;
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const encounterTime = time || `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
  if (!clientId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send({ message: "clientId and items array are required." });
  }
  const uid = userId ? parseInt(userId, 10) : null;
  if (!uid) {
    return res.status(400).send({ message: "userId is required." });
  }
  const byService = new Map();
  const toUpdateIdsSet = new Set();
  const toCancelIdsSet = new Set();
  items.forEach((item) => {
    const serviceProvidedId = parseInt(item.serviceProvidedId, 10);
    if (!serviceProvidedId) return;
    const existingClientServiceId = item.existingClientServiceId ? parseInt(item.existingClientServiceId, 10) : null;
    if (item.cancel && existingClientServiceId) toCancelIdsSet.add(existingClientServiceId);
    if (item.provided && existingClientServiceId && !item.cancel) toUpdateIdsSet.add(existingClientServiceId);
    const existing = byService.get(serviceProvidedId) || { requested: false, provided: false, cancel: false };
    if (item.requested) existing.requested = true;
    if (item.provided) existing.provided = true;
    if (item.cancel) existing.cancel = true;
    existing.existingClientServiceId = existingClientServiceId;
    byService.set(serviceProvidedId, existing);
  });
  const toCreate = Array.from(byService.entries())
    .filter(([, flags]) => (flags.requested || flags.provided) && !flags.existingClientServiceId && !flags.cancel)
    .map(([serviceProvidedId, flags]) => ({ serviceProvidedId, ...flags }));
  const toUpdateIds = Array.from(toUpdateIdsSet);
  const toCancelIds = Array.from(toCancelIdsSet);
  if (toCreate.length === 0 && toUpdateIds.length === 0 && toCancelIds.length === 0) {
    return res.status(400).send({ message: "At least one service must be marked requested, provided, or cancelled." });
  }
  try {
    const encounter = await Encounter.create({
      clientId,
      userId: uid,
      date: today,
      time: encounterTime,
      notes: notes || null,
    });
    const encounterId = encounter.id;
    const created = [];
    if (toCreate.length > 0) {
      const clientServiceRecords = toCreate.map((r) => ({
        clientId,
        serviceProvidedId: r.serviceProvidedId,
        status: r.provided ? "provided" : "requested",
        requestedDate: r.requested ? today : null,
        providedDate: r.provided ? today : null,
        encounterRequestedId: r.requested ? encounterId : null,
        encounterProvidedId: r.provided ? encounterId : null,
      }));
      created.push(...(await ClientService.bulkCreate(clientServiceRecords)));
    }
    const updated = [];
    for (const id of toUpdateIds) {
      await ClientService.update(
        { encounterProvidedId: encounterId, providedDate: today, status: "provided" },
        { where: { id, clientId } }
      );
      const rec = await ClientService.findByPk(id);
      if (rec) updated.push(rec);
    }
    const cancelled = [];
    for (const id of toCancelIds) {
      await ClientService.update(
        { status: "cancelled", cancelledDate: today },
        { where: { id, clientId } }
      );
      const rec = await ClientService.findByPk(id);
      if (rec) cancelled.push(rec);
    }
    res.send({ encounter, clientServices: [...created, ...updated, ...cancelled] });
  } catch (err) {
    logger.error(`Error creating encounter/client services: ${err.message}`);
    res.status(500).send({ message: err.message || "Error creating encounter and client services." });
  }
};

exports.create = (req, res) => {
  const data = {};
  ATTRS.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  data.clientId = parseInt(req.params.clientId, 10) || data.clientId;
  if (!data.clientId) {
    return res.status(400).send({ message: "clientId is required." });
  }
  if (!data.status) data.status = "requested";
  ClientService.create(data)
    .then((result) => res.send(result))
    .catch((err) => {
      logger.error(`Error creating client service: ${err.message}`);
      res.status(500).send({ message: err.message || "Error creating client service." });
    });
};

exports.findAllForClient = (req, res) => {
  const clientId = req.params.clientId;
  ClientService.findAll({
    where: { clientId },
    include: [
      { model: Location, as: "location", attributes: ["id", "name", "address"], include: [{ model: db.organization, as: "organization", attributes: ["id", "name"] }] },
      { model: Lookup, as: "serviceProvided", attributes: ["id", "value"] },
      { model: Encounter, as: "encounterRequested", attributes: ["id", "date", "time", "notes"] },
      { model: Encounter, as: "encounterProvided", attributes: ["id", "date", "time", "notes"] },
    ],
    order: [["requestedDate", "DESC"], ["id", "DESC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const { clientId, id } = req.params;
  ClientService.findOne({
    where: { id, clientId },
    include: [
      { model: Location, as: "location", attributes: ["id", "name", "address"], include: [{ model: db.organization, as: "organization", attributes: ["id", "name"] }] },
      { model: Lookup, as: "serviceProvided", attributes: ["id", "value"] },
      { model: Encounter, as: "encounterRequested", attributes: ["id", "date", "time", "notes"] },
      { model: Encounter, as: "encounterProvided", attributes: ["id", "date", "time", "notes"] },
    ],
  })
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Client service with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const { clientId, id } = req.params;
  const data = {};
  ATTRS.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  ClientService.update(data, { where: { id, clientId } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Client service was updated successfully." });
      else res.send({ message: `Cannot update client service with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const { clientId, id } = req.params;
  ClientService.destroy({ where: { id, clientId } })
    .then((num) => {
      if (num === 1) res.send({ message: "Client service was deleted successfully." });
      else res.send({ message: `Cannot delete client service with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
