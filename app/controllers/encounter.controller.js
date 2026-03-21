import db from "../models/index.js";
import logger from "../config/logger.js";

const Encounter = db.encounter;
const User = db.user;
const Client = db.client;

const exports = {};

exports.findAll = (req, res) => {
  const clientId = req.query.clientId ? parseInt(req.query.clientId, 10) : null;
  const date = req.query.date?.trim();
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  const where = {};
  if (clientId) where.clientId = clientId;
  if (date) where.date = date;
  const include = [
    { model: Client, as: "client", attributes: ["id", "firstName", "lastName", "middleName", "phone"], required: true },
    { model: User, as: "user", attributes: ["id", "fName", "lName", "username"] },
  ];
  if (userId) include[0].where = { userId };
  Encounter.findAll({
    where,
    include,
    order: [["date", "DESC"], ["id", "DESC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.create = (req, res) => {
  const data = {
    clientId: parseInt(req.params.clientId, 10),
    date: req.body.date,
    userId: req.body.userId,
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

exports.findAllForClient = (req, res) => {
  const clientId = req.params.clientId;
  Encounter.findAll({
    where: { clientId },
    include: [{ model: User, as: "user", attributes: ["id", "fName", "lName", "username"] }],
    order: [["date", "DESC"], ["id", "DESC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const { clientId, id } = req.params;
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
    ],
  })
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Encounter with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const { clientId, id } = req.params;
  const data = {};
  ["date", "time", "userId", "notes"].forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  Encounter.update(data, { where: { id, clientId } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Encounter was updated successfully." });
      else res.send({ message: `Cannot update encounter with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const { clientId, id } = req.params;
  Encounter.destroy({ where: { id, clientId } })
    .then((num) => {
      if (num === 1) res.send({ message: "Encounter was deleted successfully." });
      else res.send({ message: `Cannot delete encounter with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
