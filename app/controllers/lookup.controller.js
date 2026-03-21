import db from "../models/index.js";

const Lookup = db.lookup;
const Op = db.Sequelize.Op;

const exports = {};

exports.findByType = (req, res) => {
  const type = req.params.type;
  Lookup.findAll({
    where: {
      type,
      [Op.or]: [{ status: "Active" }, { status: null }],
    },
    order: [["sortOrder", "ASC"], ["value", "ASC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findAll = (req, res) => {
  Lookup.findAll({ order: [["type", "ASC"], ["sortOrder", "ASC"], ["value", "ASC"]] })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.create = (req, res) => {
  Lookup.create(req.body)
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const id = req.params.id;
  Lookup.update(req.body, { where: { id } })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Lookup was updated successfully." });
      else res.send({ message: `Cannot update lookup with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const id = req.params.id;
  Lookup.destroy({ where: { id } })
    .then((num) => {
      if (num === 1) res.send({ message: "Lookup was deleted successfully." });
      else res.send({ message: `Cannot delete lookup with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
