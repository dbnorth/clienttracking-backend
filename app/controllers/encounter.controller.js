import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleClientOrNull } from "../authorization/clientAccess.js";
import { getClientTenantScope } from "../authorization/tenantScope.js";

const Encounter = db.encounter;
const User = db.user;
const Client = db.client;
const Location = db.location;
const Lookup = db.lookup;

const exports = {};

exports.findAll = (req, res) => {
  const scope = getClientTenantScope(req);
  if (scope.mode === "none") {
    return res.send([]);
  }

  const clientId = req.query.clientId ? parseInt(req.query.clientId, 10) : null;
  const date = req.query.date?.trim();
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  const organizationId = req.query.organizationId ? parseInt(req.query.organizationId, 10) : null;
  const where = {};
  if (clientId) where.clientId = clientId;
  if (date) where.date = date;
  const clientInclude = {
    model: Client,
    as: "client",
    attributes: ["id", "firstName", "lastName", "middleName", "phone"],
    required: true,
  };
  if (scope.mode === "scoped") {
    clientInclude.include = [
      {
        model: Location,
        as: "intakeLocation",
        where: { organizationId: scope.organizationId },
        required: true,
        attributes: [],
      },
    ];
    if (userId) {
      clientInclude.where = { userId };
    }
  } else if (organizationId) {
    clientInclude.include = [
      { model: Location, as: "intakeLocation", where: { organizationId }, required: true, attributes: [] },
    ];
  } else if (userId) {
    clientInclude.where = { userId };
  }
  const include = [
    clientInclude,
    { model: User, as: "user", attributes: ["id", "fName", "lName", "username"] },
    { model: Lookup, as: "encounterType", attributes: ["id", "value"] },
  ];
  Encounter.findAll({
    where,
    include,
    order: [["date", "DESC"], ["id", "DESC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.create = async (req, res) => {
  const clientId = parseInt(req.params.clientId, 10);
  const allowed = await getAccessibleClientOrNull(req, clientId);
  if (!allowed) {
    return res.status(404).send({ message: "Client not found." });
  }
  const etid =
    req.body.encounterTypeId != null && req.body.encounterTypeId !== ""
      ? parseInt(req.body.encounterTypeId, 10)
      : null;
  if (!etid || Number.isNaN(etid)) {
    return res.status(400).send({ message: "Encounter type is required." });
  }
  const data = {
    clientId,
    date: req.body.date,
    userId: req.body.userId,
    encounterTypeId: etid,
    notes: req.body.notes || null,
  };
  if (!data.userId) {
    return res.status(400).send({ message: "userId is required." });
  }
  Encounter.create(data)
    .then((result) => res.send(result))
    .catch((err) => {
      logger.error(`Error creating encounter: ${err.message}`);
      res.status(500).send({ message: err.message || "Error creating encounter." });
    });
};

exports.findAllForClient = async (req, res) => {
  const clientId = req.params.clientId;
  const allowed = await getAccessibleClientOrNull(req, clientId);
  if (!allowed) {
    return res.status(404).send({ message: "Client not found." });
  }
  Encounter.findAll({
    where: { clientId },
    include: [
      { model: User, as: "user", attributes: ["id", "fName", "lName", "username"] },
      { model: Lookup, as: "encounterType", attributes: ["id", "value"] },
    ],
    order: [["date", "DESC"], ["id", "DESC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = async (req, res) => {
  const { clientId, id } = req.params;
  const allowed = await getAccessibleClientOrNull(req, clientId);
  if (!allowed) {
    return res.status(404).send({ message: `Encounter with id=${id} not found.` });
  }
  Encounter.findOne({
    where: { id, clientId },
    include: [
      {
        model: Client,
        as: "client",
        attributes: ["id", "firstName", "lastName", "middleName", "phone", "intakeLocationId"],
        include: [
          {
            model: db.location,
            as: "intakeLocation",
            attributes: ["id", "name", "address"],
            required: false,
          },
        ],
      },
      { model: User, as: "user", attributes: ["id", "fName", "lName", "username"] },
      { model: Lookup, as: "encounterType", attributes: ["id", "value"] },
    ],
  })
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Encounter with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = async (req, res) => {
  const { clientId, id } = req.params;
  const allowed = await getAccessibleClientOrNull(req, clientId);
  if (!allowed) {
    return res.status(404).send({ message: `Encounter with id=${id} not found.` });
  }
  const data = {};
  ["date", "time", "userId", "encounterTypeId", "notes"].forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  Encounter.update(data, { where: { id, clientId } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Encounter was updated successfully." });
      else res.send({ message: `Cannot update encounter with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = async (req, res) => {
  const { clientId, id } = req.params;
  const allowed = await getAccessibleClientOrNull(req, clientId);
  if (!allowed) {
    return res.status(404).send({ message: `Encounter with id=${id} not found.` });
  }
  Encounter.destroy({ where: { id, clientId } })
    .then((num) => {
      if (num === 1) res.send({ message: "Encounter was deleted successfully." });
      else res.send({ message: `Cannot delete encounter with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
