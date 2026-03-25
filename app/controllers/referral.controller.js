import db from "../models/index.js";
import { getClientTenantScope } from "../authorization/tenantScope.js";

const Referral = db.referral;
const Client = db.client;
const Location = db.location;
const ReferringOrganization = db.referringOrganization;
const Lookup = db.lookup;

const exports = {};

exports.findAll = (req, res) => {
  const scope = getClientTenantScope(req);
  if (scope.mode === "none") {
    return res.send([]);
  }

  const clientId = req.query.clientId ? parseInt(req.query.clientId, 10) : null;
  const referringOrganizationId = req.query.referringOrganizationId
    ? parseInt(req.query.referringOrganizationId, 10)
    : null;
  const date = req.query.date?.trim();
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  const organizationId = req.query.organizationId ? parseInt(req.query.organizationId, 10) : null;

  const where = {};
  if (clientId) where.clientId = clientId;
  if (referringOrganizationId) where.referringOrganizationId = referringOrganizationId;
  if (date) where.dateOfReferral = date;

  const clientInclude = {
    model: Client,
    as: "client",
    attributes: ["id", "firstName", "lastName", "middleName", "phone"],
    required: true,
  };
  if (scope.mode === "scoped") {
    clientInclude.include = [
      {
        model: Location,
        as: "intakeLocation",
        where: { organizationId: scope.organizationId },
        required: true,
        attributes: [],
      },
    ];
    if (userId) {
      clientInclude.where = { userId };
    }
  } else if (organizationId) {
    clientInclude.include = [
      { model: Location, as: "intakeLocation", where: { organizationId }, required: true, attributes: [] },
    ];
  } else if (userId) {
    clientInclude.where = { userId };
  }

  const include = [
    clientInclude,
    {
      model: ReferringOrganization,
      as: "referringOrganization",
      attributes: ["id", "name", "caseWorkerName", "phone", "organizationId"],
      required: true,
      include: [{ model: Lookup, as: "referringOrganizationType", attributes: ["id", "value"] }],
    },
  ];

  Referral.findAll({
    where,
    include,
    order: [["dateOfReferral", "DESC"], ["id", "DESC"]],
  })
    .then((data) => res.send(data))
    .catch((err) => res.status(500).send({ message: err.message }));
};

export default exports;
