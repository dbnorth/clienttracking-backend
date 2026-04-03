import db from "../models/index.js";
import {
  isSuperAdmin,
  orgFkListWhere,
  orgFkRowWhere,
  parseActingOrganizationHeader,
  sessionTenantScopeWhere,
} from "../authorization/tenantScope.js";
import {
  starterSetLookupTemplates,
  starterSetReferringOrganizationTemplates,
} from "../data/lookupSeedData.js";

const Lookup = db.lookup;
const Organization = db.organization;
const ReferringOrganization = db.referringOrganization;
const Op = db.Sequelize.Op;

const listInclude = [{ model: Organization, as: "organization", attributes: ["id", "name"], required: false }];

/**
 * When lookups are listed across all organizations (superadmin, no acting-org header),
 * the same display value (e.g. "Male") can exist once per org — duplicate v-select labels.
 * Keep the first row per trimmed case-insensitive value (query order: sortOrder, value).
 */
const dedupeLookupsByDisplayValue = (rows) => {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = String(row.value ?? "").trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
};

const listScopeForFind = (req) => {
  if (!isSuperAdmin(req)) {
    return sessionTenantScopeWhere(req);
  }
  return orgFkListWhere(req);
};

const resolveStarterSetOrganizationId = (req, bodyOrganizationId) => {
  if (!isSuperAdmin(req)) {
    const oid = req.user?.organizationId;
    if (oid == null || oid === "") return null;
    return Number(oid);
  }
  const acting = parseActingOrganizationHeader(req);
  if (acting != null) return acting;
  if (bodyOrganizationId != null && bodyOrganizationId !== "") {
    const p = parseInt(bodyOrganizationId, 10);
    return Number.isNaN(p) ? null : p;
  }
  return null;
};

const canSeedStarterSetForOrg = (req, orgId) => {
  if (!isSuperAdmin(req)) {
    return Number(req.user?.organizationId) === Number(orgId);
  }
  const acting = parseActingOrganizationHeader(req);
  if (acting != null) return Number(orgId) === Number(acting);
  return true;
};

/** Optional ?organizationId= on GET /lookups/type/:type — workers only their org; superadmin with acting header only that org; bare superadmin may request any org. */
const canQueryLookupOrganizationId = (req, orgId) => {
  if (orgId == null || Number.isNaN(orgId)) return false;
  if (!isSuperAdmin(req)) {
    return Number(req.user?.organizationId) === Number(orgId);
  }
  const acting = parseActingOrganizationHeader(req);
  if (acting != null) {
    return Number(orgId) === Number(acting);
  }
  return true;
};

const exports = {};

exports.findByType = (req, res) => {
  const type = req.params.type;
  const qOrg = req.query.organizationId;
  const requestedOrgId =
    qOrg != null && String(qOrg).trim() !== "" ? parseInt(String(qOrg), 10) : NaN;
  const hasExplicitOrg = !Number.isNaN(requestedOrgId);

  let listScope;
  if (hasExplicitOrg) {
    if (!canQueryLookupOrganizationId(req, requestedOrgId)) {
      return res.status(403).send({ message: "Not allowed to load lookups for that organization." });
    }
    listScope = { organizationId: requestedOrgId };
  } else {
    listScope = listScopeForFind(req);
    if (!isSuperAdmin(req) && listScope === null) {
      return res.send([]);
    }
  }

  const where = {
    type,
    [Op.or]: [{ status: "Active" }, { status: null }],
  };
  Object.assign(where, listScope || {});
  Lookup.findAll({
    where,
    order: [["sortOrder", "ASC"], ["value", "ASC"], ["id", "ASC"]],
  })
    .then((data) => {
      const rows = data.map((r) => (typeof r.toJSON === "function" ? r.toJSON() : r));
      const scopedToOneOrg = listScope && Object.keys(listScope).length > 0;
      res.send(scopedToOneOrg ? rows : dedupeLookupsByDisplayValue(rows));
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.findAll = (req, res) => {
  const listScope = listScopeForFind(req);
  if (!isSuperAdmin(req) && listScope === null) {
    return res.send([]);
  }
  Lookup.findAll({
    where: listScope || {},
    order: [["type", "ASC"], ["sortOrder", "ASC"], ["value", "ASC"]],
    include: listInclude,
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.create = (req, res) => {
  const { type, value, sortOrder, status, organizationId } = req.body;
  if (!type?.trim() || !value?.trim()) {
    return res.status(400).send({ message: "Type and value are required." });
  }
  let orgId = organizationId;
  if (!isSuperAdmin(req)) {
    orgId = req.user?.organizationId;
    if (!orgId) {
      return res.status(400).send({ message: "Your account must be assigned to an organization." });
    }
  } else {
    if (orgId == null || orgId === "") {
      return res.status(400).send({ message: "Organization is required." });
    }
    orgId = parseInt(orgId, 10);
    if (Number.isNaN(orgId)) {
      return res.status(400).send({ message: "Invalid organizationId." });
    }
  }
  Lookup.create({
    type: type.trim(),
    value: value.trim(),
    sortOrder: sortOrder != null ? parseInt(sortOrder, 10) || 0 : 0,
    status: status || "Active",
    organizationId: orgId,
  })
    .then((created) =>
      Lookup.findByPk(created.id, {
        include: listInclude,
      })
    )
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.update = (req, res) => {
  const id = req.params.id;
  const where = orgFkRowWhere(req, id);
  if (!where) {
    return res.status(404).send({ message: `Cannot update lookup with id=${id}.` });
  }
  const { type, value, sortOrder, status, organizationId } = req.body;
  const data = {};
  if (type !== undefined) data.type = type.trim();
  if (value !== undefined) data.value = value.trim();
  if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder, 10) || 0;
  if (status !== undefined) data.status = status;
  if (isSuperAdmin(req) && organizationId !== undefined) {
    const oid = parseInt(organizationId, 10);
    if (!Number.isNaN(oid)) data.organizationId = oid;
  }
  Lookup.update(data, { where })
    .then((num) => {
      if (num[0] >= 1) res.send({ message: "Lookup was updated successfully." });
      else res.send({ message: `Cannot update lookup with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.delete = (req, res) => {
  const id = req.params.id;
  const where = orgFkRowWhere(req, id);
  if (!where) {
    return res.status(404).send({ message: `Cannot delete lookup with id=${id}.` });
  }
  Lookup.destroy({ where })
    .then((num) => {
      if (num === 1) res.send({ message: "Lookup was deleted successfully." });
      else res.send({ message: `Cannot delete lookup with id=${id}.` });
    })
    .catch((err) => res.status(500).send({ message: err.message }));
};

exports.seedStarterSet = async (req, res) => {
  const orgId = resolveStarterSetOrganizationId(req, req.body?.organizationId);
  if (orgId == null) {
    return res.status(400).send({
      message:
        "Organization is required. Select an organization in List Values (superadmin) or use Act as organization.",
    });
  }
  if (!canSeedStarterSetForOrg(req, orgId)) {
    return res.status(403).send({ message: "You cannot load starter values for that organization." });
  }
  const org = await Organization.findByPk(orgId, { attributes: ["id"] });
  if (!org) {
    return res.status(404).send({ message: "Organization not found." });
  }
  try {
    let lookupsCreated = 0;
    let lookupsSkipped = 0;
    for (const row of starterSetLookupTemplates) {
      const [, wasCreated] = await Lookup.findOrCreate({
        where: { organizationId: orgId, type: row.type, value: row.value },
        defaults: {
          type: row.type,
          value: row.value,
          sortOrder: row.sortOrder,
          status: row.status || "Active",
          organizationId: orgId,
        },
      });
      if (wasCreated) lookupsCreated += 1;
      else lookupsSkipped += 1;
    }
    const typeLookup = await Lookup.findOne({
      where: { organizationId: orgId, type: "referring_organization_type", status: "Active" },
      order: [["sortOrder", "ASC"], ["id", "ASC"]],
      attributes: ["id"],
    });
    const defaultTypeId = typeLookup?.id ?? null;
    let referringOrganizationsCreated = 0;
    let referringOrganizationsSkipped = 0;
    for (const ro of starterSetReferringOrganizationTemplates) {
      const [, wasCreated] = await ReferringOrganization.findOrCreate({
        where: { organizationId: orgId, name: ro.name },
        defaults: {
          name: ro.name,
          caseWorkerName: ro.caseWorkerName || null,
          phone: ro.phone || null,
          referringOrganizationTypeId: defaultTypeId,
          organizationId: orgId,
        },
      });
      if (wasCreated) referringOrganizationsCreated += 1;
      else referringOrganizationsSkipped += 1;
    }
    res.send({
      message: "Starter list values loaded.",
      organizationId: orgId,
      lookupsCreated,
      lookupsSkipped,
      referringOrganizationsCreated,
      referringOrganizationsSkipped,
    });
  } catch (err) {
    res.status(500).send({ message: err.message || "Could not load starter set." });
  }
};

export default exports;
