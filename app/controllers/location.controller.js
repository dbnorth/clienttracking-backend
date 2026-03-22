import db from "../models/index.js";

const Location = db.location;
const Organization = db.organization;

const ATTRS = ["organizationId", "name", "address", "city", "state", "zip", "contactName", "phoneNumber"];
const exports = {};

exports.findAll = (req, res) => {
  Location.findAll({
    order: [["name", "ASC"]],
    include: [{ model: Organization, as: "organization", attributes: ["id", "name"] }],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  Location.findByPk(id, {
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
  Location.create(data)
    .then((created) => res.send(created))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const id = req.params.id;
  const data = {};
  ATTRS.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  Location.update(data, { where: { id } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Location was updated successfully." });
      else res.send({ message: `Cannot update location with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const id = req.params.id;
  Location.destroy({ where: { id } })
    .then((num) => {
      if (num === 1) res.send({ message: "Location was deleted successfully." });
      else res.send({ message: `Cannot delete location with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
