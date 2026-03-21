import db from "../models/index.js";
import logger from "../config/logger.js";

const ServiceRecord = db.serviceRecord;
const Lookup = db.lookup;

const exports = {};

exports.create = (req, res) => {
  const data = {
    clientId: req.params.clientId,
    date: req.body.date,
    serviceProvidedId: req.body.serviceProvidedId,
  };
  ServiceRecord.create(data)
    .then((result) => res.send(result))
    .catch((err) => {
      logger.error(`Error creating service record: ${err.message}`);
      res.status(500).send({ message: err.message || "Error creating service record." });
    });
};

exports.findAllForClient = (req, res) => {
  const clientId = req.params.clientId;
  ServiceRecord.findAll({
    where: { clientId },
    include: [{ model: Lookup, as: "serviceProvided", attributes: ["id", "value"] }],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const { clientId, id } = req.params;
  ServiceRecord.update(req.body, { where: { id, clientId } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Service record was updated successfully." });
      else res.send({ message: `Cannot update service record with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const { clientId, id } = req.params;
  ServiceRecord.destroy({ where: { id, clientId } })
    .then((num) => {
      if (num === 1) res.send({ message: "Service record was deleted successfully." });
      else res.send({ message: `Cannot delete service record with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
