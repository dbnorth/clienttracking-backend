import db from "../models/index.js";

const Organization = db.organization;

const exports = {};

exports.findAll = (req, res) => {
  Organization.findAll({ order: [["name", "ASC"]] })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = req.params.id;
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
  Organization.update(req.body, { where: { id } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Organization was updated successfully." });
      else res.send({ message: `Cannot update organization with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const id = req.params.id;
  Organization.destroy({ where: { id } })
    .then((num) => {
      if (num === 1) res.send({ message: "Organization was deleted successfully." });
      else res.send({ message: `Cannot delete organization with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
