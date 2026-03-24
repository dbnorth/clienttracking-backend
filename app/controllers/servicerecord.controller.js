import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleClientOrNull } from "../authorization/clientAccess.js";

const ServiceRecord = db.serviceRecord;
const Lookup = db.lookup;

const exports = {};

exports.create = async (req, res) => {
  const clientId = req.params.clientId;
  const allowedClient = await getAccessibleClientOrNull(req, clientId);
  if (!allowedClient) {
    return res.status(404).send({ message: "Client not found." });
  }
  const data = {
    clientId,
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

exports.findAllForClient = async (req, res) => {
  const clientId = req.params.clientId;
  const allowedClient = await getAccessibleClientOrNull(req, clientId);
  if (!allowedClient) {
    return res.status(404).send({ message: "Client not found." });
  }
  ServiceRecord.findAll({
    where: { clientId },
    include: [{ model: Lookup, as: "serviceProvided", attributes: ["id", "value"] }],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = async (req, res) => {
  const { clientId, id } = req.params;
  const allowedClient = await getAccessibleClientOrNull(req, clientId);
  if (!allowedClient) {
    return res.status(404).send({ message: `Cannot update service record with id=${id}.` });
  }
  ServiceRecord.update(req.body, { where: { id, clientId } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Service record was updated successfully." });
      else res.send({ message: `Cannot update service record with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = async (req, res) => {
  const { clientId, id } = req.params;
  const allowedClient = await getAccessibleClientOrNull(req, clientId);
  if (!allowedClient) {
    return res.status(404).send({ message: `Cannot delete service record with id=${id}.` });
  }
  ServiceRecord.destroy({ where: { id, clientId } })
    .then((num) => {
      if (num === 1) res.send({ message: "Service record was deleted successfully." });
      else res.send({ message: `Cannot delete service record with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
