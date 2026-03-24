import db from "../models/index.js";
import { getClientTenantScope } from "./tenantScope.js";

const Client = db.client;
const Location = db.location;

const intakeLocationInclude = {
  model: Location,
  as: "intakeLocation",
  attributes: ["id", "organizationId"],
  include: [{ model: db.organization, as: "organization", attributes: ["id"] }],
};

export const intakeOrgIdFromClientRow = (row) => {
  const loc = row?.intakeLocation;
  if (!loc) return null;
  return loc.organizationId ?? loc.organization?.id ?? null;
};

/** Same rules as client list/detail: tenant via intakeLocation.organizationId. */
export const clientAccessibleForScope = (req, row) => {
  const scope = getClientTenantScope(req);
  if (scope.mode === "none") return false;
  if (scope.mode === "all") return true;
  const oid = intakeOrgIdFromClientRow(row);
  if (oid == null) return false;
  return Number(oid) === Number(scope.organizationId);
};

export const loadClientForAccess = (clientId) => {
  const id = parseInt(clientId, 10);
  if (!id) return Promise.resolve(null);
  return Client.findByPk(id, { include: [intakeLocationInclude] });
};

/**
 * Loads client and verifies tenant scope. Returns null if missing or forbidden (use 404).
 */
export const getAccessibleClientOrNull = async (req, clientId) => {
  const row = await loadClientForAccess(clientId);
  if (!row || !clientAccessibleForScope(req, row)) return null;
  return row;
};
