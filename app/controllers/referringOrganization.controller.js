import db from "../models/index.js";

const ReferringOrganization = db.referringOrganization;
const Lookup = db.lookup;

const exports = {};

exports.findAll = (req, res) => {
  ReferringOrganization.findAll({
    order: [["name", "ASC"]],
    include: [{ model: Lookup, as: "referringOrganizationType", attributes: ["id", "value"] }],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  ReferringOrganization.findByPk(id, {
    include: [{ model: Lookup, as: "referringOrganizationType", attributes: ["id", "value"] }],
  })
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Referring organization with id=${id} not found.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.create = (req, res) => {
  ReferringOrganization.create(req.body)
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const id = req.params.id;
  ReferringOrganization.update(req.body, { where: { id } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Referring organization was updated successfully." });
      else res.send({ message: `Cannot update referring organization with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const id = req.params.id;
  ReferringOrganization.destroy({ where: { id } })
    .then((num) => {
      if (num === 1) res.send({ message: "Referring organization was deleted successfully." });
      else res.send({ message: `Cannot delete referring organization with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
