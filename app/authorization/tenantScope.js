/**
 * Superadmins can send X-Acting-Organization-Id to scope tenant data to one org.
 * Without the header, superadmins keep global access (all orgs) where applicable.
 */

export const parseActingOrganizationHeader = (req) => {
  const h = req.get("x-acting-organization-id");
  if (req.user?.role !== "superadmin" || h == null || h === "") return null;
  const id = parseInt(h, 10);
  return Number.isNaN(id) ? null : id;
};

export const isSuperAdmin = (req) => req.user?.role === "superadmin";

/** Non–superadmin tenant org from session. */
export const sessionTenantScopeWhere = (req) => {
  const oid = req.user?.organizationId;
  if (oid == null || oid === "") return null;
  return { organizationId: oid };
};

/** Models with FK organizationId (lookups, locations, referring orgs): list filter. */
export const orgFkListWhere = (req) => {
  if (!isSuperAdmin(req)) return sessionTenantScopeWhere(req);
  const acting = parseActingOrganizationHeader(req);
  if (acting != null) return { organizationId: acting };
  return {};
};

/** Update/delete row by id on models scoped by organizationId. */
export const orgFkRowWhere = (req, idParam) => {
  const idNum = parseInt(idParam, 10);
  if (!isSuperAdmin(req)) {
    const scope = sessionTenantScopeWhere(req);
    if (!scope) return null;
    return { id: idNum, ...scope };
  }
  const acting = parseActingOrganizationHeader(req);
  if (acting != null) return { id: idNum, organizationId: acting };
  return { id: idNum };
};

/**
 * organizations table: GET /organizations list filter.
 * Superadmin always receives all rows — the acting-org header scopes tenant data (clients, etc.),
 * not the catalog of organizations used to pick “act as” or manage orgs.
 */
export const organizationTableListWhere = (req) => {
  if (!isSuperAdmin(req)) {
    const oid = req.user?.organizationId;
    if (oid == null || oid === "") return null;
    return { id: oid };
  }
  return {};
};

/** Access check for a single organization row (id = organizations.id). */
export const canAccessOrganizationRecord = (req, orgId) => {
  const id = parseInt(orgId, 10);
  if (Number.isNaN(id)) return false;
  if (!isSuperAdmin(req)) {
    const mine = req.user?.organizationId;
    if (mine == null || mine === "") return false;
    return Number(mine) === id;
  }
  const acting = parseActingOrganizationHeader(req);
  if (acting != null) return id === acting;
  return true;
};

/** users table: list filter by user.organizationId */
export const userListWhereForActor = (req) => {
  if (!isSuperAdmin(req)) {
    const oid = req.user?.organizationId;
    if (oid == null || oid === "") return null;
    return { organizationId: oid };
  }
  const acting = parseActingOrganizationHeader(req);
  if (acting != null) return { organizationId: acting };
  return {};
};

/**
 * Clients belong to a tenant via intakeLocation.organizationId (locations.organizationId).
 * - Non–superadmin: scoped to session org; no org in session → no access.
 * - Superadmin with X-Acting-Organization-Id: scoped to that org.
 * - Superadmin without acting: global (all clients).
 */
export const getClientTenantScope = (req) => {
  if (!isSuperAdmin(req)) {
    const oid = req.user?.organizationId;
    if (oid == null || oid === "") return { mode: "none" };
    return { mode: "scoped", organizationId: oid };
  }
  const acting = parseActingOrganizationHeader(req);
  if (acting != null) return { mode: "scoped", organizationId: acting };
  return { mode: "all" };
};
