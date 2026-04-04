import db from "../models/index.js";
import { isSuperAdmin, orgFkListWhere, orgFkRowWhere } from "../authorization/tenantScope.js";

const ServiceCount = db.serviceCount;
const Location = db.location;
const Lookup = db.lookup;
const Organization = db.organization;
const Op = db.Sequelize.Op;

const locationListWhere = (req) => {
  if (!isSuperAdmin(req)) {
    const oid = req.user?.organizationId;
    if (oid == null || oid === "") return null;
    return { organizationId: oid };
  }
  const list = orgFkListWhere(req);
  return list || {};
};

const includeForList = (req, extraLocationWhere = {}) => {
  const base = locationListWhere(req);
  if (!isSuperAdmin(req) && base === null) {
    return null;
  }
  const locWhere = { ...(base || {}), ...extraLocationWhere };
  return [
    {
      model: Location,
      as: "location",
      where: locWhere,
      required: true,
      include: [{ model: Organization, as: "organization", attributes: ["id", "name"] }],
    },
    {
      model: Lookup,
      as: "serviceProvided",
      attributes: ["id", "type", "value", "organizationId"],
      required: true,
      where: { type: "service_provided" },
    },
  ];
};

const validateLookupForLocation = async (serviceProvidedId, locationId) => {
  const loc = await Location.findByPk(locationId);
  if (!loc) {
    return { ok: false, message: "Location not found." };
  }
  const lookup = await Lookup.findByPk(serviceProvidedId);
  if (!lookup || lookup.type !== "service_provided") {
    return { ok: false, message: "Invalid service — choose a value from Services Provided list values." };
  }
  if (Number(lookup.organizationId) !== Number(loc.organizationId)) {
    return { ok: false, message: "That service does not belong to the location's organization." };
  }
  return { ok: true, loc, lookup };
};

const canAccessLocationId = async (req, locationId) => {
  const idNum = parseInt(locationId, 10);
  if (Number.isNaN(idNum)) return false;
  const where = orgFkRowWhere(req, idNum);
  if (!where) return false;
  const loc = await Location.findOne({ where });
  return !!loc;
};

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const inc = includeForList(req, {});
    if (inc === null) {
      return res.send([]);
    }
    const where = {};
    if (req.query.locationId != null && String(req.query.locationId).trim() !== "") {
      const lid = parseInt(req.query.locationId, 10);
      if (!Number.isNaN(lid)) where.locationId = lid;
    }
    if (req.query.serviceProvidedId != null && String(req.query.serviceProvidedId).trim() !== "") {
      const sid = parseInt(req.query.serviceProvidedId, 10);
      if (!Number.isNaN(sid)) where.serviceProvidedId = sid;
    }
    if (req.query.fromDate || req.query.toDate) {
      where.countDate = {};
      if (req.query.fromDate) where.countDate[Op.gte] = req.query.fromDate;
      if (req.query.toDate) where.countDate[Op.lte] = req.query.toDate;
    }
    const rows = await ServiceCount.findAll({
      where,
      include: inc,
      order: [
        ["countDate", "ASC"],
        ["id", "ASC"],
      ],
    });
    res.send(rows);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Invalid id." });
    }
    const inc = includeForList(req, {});
    if (inc === null) {
      return res.status(404).send({ message: "Not found." });
    }
    const row = await ServiceCount.findOne({
      where: { id },
      include: inc,
    });
    if (!row) {
      return res.status(404).send({ message: `Service count with id=${id} not found.` });
    }
    res.send(row);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { locationId, serviceProvidedId, countDate, count } = req.body;
    const lid = parseInt(locationId, 10);
    const sid = parseInt(serviceProvidedId, 10);
    const n = parseInt(count, 10);
    if (Number.isNaN(lid) || Number.isNaN(sid)) {
      return res.status(400).send({ message: "locationId and serviceProvidedId are required." });
    }
    if (!countDate || String(countDate).trim() === "") {
      return res.status(400).send({ message: "countDate is required." });
    }
    if (Number.isNaN(n) || n < 0) {
      return res.status(400).send({ message: "count must be a non-negative integer." });
    }
    const okLoc = await canAccessLocationId(req, lid);
    if (!okLoc) {
      return res.status(403).send({ message: "You cannot add counts for that location." });
    }
    const v = await validateLookupForLocation(sid, lid);
    if (!v.ok) {
      return res.status(400).send({ message: v.message });
    }
    const created = await ServiceCount.create({
      locationId: lid,
      serviceProvidedId: sid,
      countDate,
      count: n,
    });
    const full = await ServiceCount.findByPk(created.id, { include: includeForList(req, {}) });
    res.send(full);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send({
        message: "A count already exists for this location, service, and date. Edit that row instead.",
      });
    }
    res.status(500).send({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Invalid id." });
    }
    const inc = includeForList(req, {});
    if (inc === null) {
      return res.status(404).send({ message: "Not found." });
    }
    const row = await ServiceCount.findOne({ where: { id }, include: inc });
    if (!row) {
      return res.status(404).send({ message: `Service count with id=${id} not found.` });
    }
    const data = {};
    if (req.body.countDate !== undefined) data.countDate = req.body.countDate;
    if (req.body.count !== undefined) {
      const n = parseInt(req.body.count, 10);
      if (Number.isNaN(n) || n < 0) {
        return res.status(400).send({ message: "count must be a non-negative integer." });
      }
      data.count = n;
    }
    if (req.body.locationId !== undefined) {
      const lid = parseInt(req.body.locationId, 10);
      if (Number.isNaN(lid)) {
        return res.status(400).send({ message: "Invalid locationId." });
      }
      const okLoc = await canAccessLocationId(req, lid);
      if (!okLoc) {
        return res.status(403).send({ message: "You cannot use that location." });
      }
      data.locationId = lid;
    }
    if (req.body.serviceProvidedId !== undefined) {
      const sid = parseInt(req.body.serviceProvidedId, 10);
      if (Number.isNaN(sid)) {
        return res.status(400).send({ message: "Invalid serviceProvidedId." });
      }
      data.serviceProvidedId = sid;
    }
    const finalLid = data.locationId !== undefined ? data.locationId : row.locationId;
    const finalSid = data.serviceProvidedId !== undefined ? data.serviceProvidedId : row.serviceProvidedId;
    if (data.locationId !== undefined || data.serviceProvidedId !== undefined) {
      const v = await validateLookupForLocation(finalSid, finalLid);
      if (!v.ok) {
        return res.status(400).send({ message: v.message });
      }
    }
    await row.update(data);
    const updated = await ServiceCount.findByPk(id, { include: includeForList(req, {}) });
    res.send(updated);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send({
        message: "A count already exists for this location, service, and date.",
      });
    }
    res.status(500).send({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Invalid id." });
    }
    const inc = includeForList(req, {});
    if (inc === null) {
      return res.status(404).send({ message: "Not found." });
    }
    const row = await ServiceCount.findOne({ where: { id }, include: inc });
    if (!row) {
      return res.status(404).send({ message: `Service count with id=${id} not found.` });
    }
    await row.destroy();
    res.send({ message: "Deleted successfully." });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export default exports;
