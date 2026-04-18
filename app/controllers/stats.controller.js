import { QueryTypes } from "sequelize";
import db from "../models/index.js";
import { getClientTenantScope } from "../authorization/tenantScope.js";

const sequelize = db.sequelize;
const Lookup = db.lookup;
const Op = db.Sequelize.Op;

/** Every calendar day from fromStr to toStr inclusive (YYYY-MM-DD). */
function eachDateInRange(fromStr, toStr) {
  const out = [];
  const d = new Date(`${fromStr}T12:00:00`);
  const end = new Date(`${toStr}T12:00:00`);
  if (Number.isNaN(d.getTime()) || Number.isNaN(end.getTime()) || d > end) {
    return out;
  }
  const cur = new Date(d);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

const exports = {};

/**
 * GET /stats/service-status-timeseries
 * Query: fromDate, toDate (YYYY-MM-DD), optional serviceProvidedIds (comma-separated ints).
 * Counts by date field presence (not current status): requestedDate → Requested, providedDate → Provided,
 * cancelledDate → Cancelled. A row may contribute to multiple series/days if multiple dates are set.
 */
exports.serviceStatusTimeseries = async (req, res) => {
  try {
    const fromDate = req.query.fromDate?.trim();
    const toDate = req.query.toDate?.trim();
    if (!fromDate || !toDate) {
      return res.status(400).send({ message: "fromDate and toDate are required (YYYY-MM-DD)." });
    }

    const scope = getClientTenantScope(req);
    if (scope.mode === "none") {
      const labels = eachDateInRange(fromDate, toDate);
      const zeros = labels.map(() => 0);
      return res.send({
        labels,
        datasets: [
          { label: "Requested", data: [...zeros], backgroundColor: "rgba(25, 108, 162, 0.75)" },
          { label: "Provided", data: [...zeros], backgroundColor: "rgba(71, 18, 29, 0.75)" },
          { label: "Cancelled", data: [...zeros], backgroundColor: "rgba(238, 80, 68, 0.75)" },
        ],
      });
    }

    const idParts = (req.query.serviceProvidedIds || "")
      .split(",")
      .map((s) => parseInt(String(s).trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
    const serviceFilter = idParts.length > 0 ? ` AND cs.serviceProvidedId IN (${idParts.join(",")}) ` : "";

    let orgClause = "";
    const replacements = { fromDate, toDate };
    if (scope.mode === "scoped") {
      orgClause = " AND loc.organizationId = :orgId ";
      replacements.orgId = scope.organizationId;
    }

    const baseJoin = `
      FROM clientservices cs
      INNER JOIN clients cl ON cl.id = cs.clientId
      INNER JOIN locations loc ON loc.id = cl.intakeLocationId
      WHERE cs.serviceProvidedId IS NOT NULL
        ${orgClause}
        ${serviceFilter}
    `;
    const sql = `
      SELECT activityDate, status, cnt FROM (
        SELECT DATE(cs.requestedDate) AS activityDate, 'requested' AS status, COUNT(*) AS cnt
        ${baseJoin}
          AND cs.requestedDate IS NOT NULL
          AND cs.requestedDate BETWEEN :fromDate AND :toDate
        GROUP BY DATE(cs.requestedDate)
        UNION ALL
        SELECT DATE(cs.providedDate), 'provided', COUNT(*)
        ${baseJoin}
          AND cs.providedDate IS NOT NULL
          AND cs.providedDate BETWEEN :fromDate AND :toDate
        GROUP BY DATE(cs.providedDate)
        UNION ALL
        SELECT DATE(cs.cancelledDate), 'cancelled', COUNT(*)
        ${baseJoin}
          AND cs.cancelledDate IS NOT NULL
          AND cs.cancelledDate BETWEEN :fromDate AND :toDate
        GROUP BY DATE(cs.cancelledDate)
      ) AS combined
      ORDER BY activityDate ASC, status ASC
    `;

    const rows = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const labels = eachDateInRange(fromDate, toDate);
    const byDateStatus = new Map();
    for (const r of rows) {
      const d = r.activityDate instanceof Date ? r.activityDate.toISOString().slice(0, 10) : String(r.activityDate).slice(0, 10);
      const st = String(r.status || "").toLowerCase();
      const key = `${d}|${st}`;
      byDateStatus.set(key, (byDateStatus.get(key) || 0) + (Number(r.cnt) || 0));
    }

    const requested = [];
    const provided = [];
    const cancelled = [];
    for (const label of labels) {
      requested.push(byDateStatus.get(`${label}|requested`) ?? 0);
      provided.push(byDateStatus.get(`${label}|provided`) ?? 0);
      cancelled.push(byDateStatus.get(`${label}|cancelled`) ?? 0);
    }

    return res.send({
      labels,
      datasets: [
        { label: "Requested", data: requested, backgroundColor: "rgba(25, 108, 162, 0.75)" },
        { label: "Provided", data: provided, backgroundColor: "rgba(71, 18, 29, 0.75)" },
        { label: "Cancelled", data: cancelled, backgroundColor: "rgba(238, 80, 68, 0.75)" },
      ],
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

/**
 * GET /stats/clients-added-timeseries
 * Query: fromDate, toDate (YYYY-MM-DD); optional initialSituationId, referralTypeId (positive ints).
 * Counts clients per calendar day by dateOfFirstContact (first contact / “date added”).
 */
exports.clientsAddedTimeseries = async (req, res) => {
  try {
    const fromDate = req.query.fromDate?.trim();
    const toDate = req.query.toDate?.trim();
    if (!fromDate || !toDate) {
      return res.status(400).send({ message: "fromDate and toDate are required (YYYY-MM-DD)." });
    }

    const parseOptionalPositiveInt = (val, fieldName) => {
      if (val == null || String(val).trim() === "") return null;
      const n = parseInt(String(val).trim(), 10);
      if (Number.isNaN(n) || n < 1) {
        return { error: `${fieldName} must be a positive integer when provided.` };
      }
      return { value: n };
    }
    const initialParsed = parseOptionalPositiveInt(req.query.initialSituationId, "initialSituationId");
    if (initialParsed?.error) return res.status(400).send({ message: initialParsed.error });
    const referralParsed = parseOptionalPositiveInt(req.query.referralTypeId, "referralTypeId");
    if (referralParsed?.error) return res.status(400).send({ message: referralParsed.error });
    const initialSituationId = initialParsed?.value ?? null;
    const referralTypeId = referralParsed?.value ?? null;

    const scope = getClientTenantScope(req);
    if (scope.mode === "none") {
      const labels = eachDateInRange(fromDate, toDate);
      const zeros = labels.map(() => 0);
      return res.send({
        labels,
        datasets: [
          {
            label: "New clients",
            data: [...zeros],
            backgroundColor: "rgba(71, 18, 29, 0.75)",
          },
        ],
      });
    }

    let orgClause = "";
    const replacements = { fromDate, toDate };
    if (scope.mode === "scoped") {
      orgClause = " AND loc.organizationId = :orgId ";
      replacements.orgId = scope.organizationId;
    }

    let lookupClauses = "";
    if (initialSituationId != null) {
      lookupClauses += " AND cl.initialSituationId = :initialSituationId ";
      replacements.initialSituationId = initialSituationId;
    }
    if (referralTypeId != null) {
      lookupClauses += " AND cl.referralTypeId = :referralTypeId ";
      replacements.referralTypeId = referralTypeId;
    }

    const sql = `
      SELECT DATE(cl.dateOfFirstContact) AS activityDate, COUNT(*) AS cnt
      FROM clients cl
      INNER JOIN locations loc ON loc.id = cl.intakeLocationId
      WHERE cl.dateOfFirstContact IS NOT NULL
        AND cl.dateOfFirstContact BETWEEN :fromDate AND :toDate
        ${orgClause}
        ${lookupClauses}
      GROUP BY DATE(cl.dateOfFirstContact)
      ORDER BY activityDate ASC
    `;

    const rows = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const labels = eachDateInRange(fromDate, toDate);
    const byDate = new Map();
    for (const r of rows) {
      const d =
        r.activityDate instanceof Date ? r.activityDate.toISOString().slice(0, 10) : String(r.activityDate).slice(0, 10);
      byDate.set(d, (byDate.get(d) || 0) + (Number(r.cnt) || 0));
    }

    const data = labels.map((label) => byDate.get(label) ?? 0);

    return res.send({
      labels,
      datasets: [
        {
          label: "New clients",
          data,
          backgroundColor: "rgba(71, 18, 29, 0.75)",
        },
      ],
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

const SERVICE_COUNT_CHART_COLORS = [
  "rgba(71, 18, 29, 0.75)",
  "rgba(25, 108, 162, 0.75)",
  "rgba(238, 80, 68, 0.75)",
  "rgba(46, 125, 50, 0.75)",
  "rgba(123, 31, 162, 0.75)",
  "rgba(245, 124, 0, 0.75)",
];

/**
 * GET /stats/service-counts-timeseries
 * Query: fromDate, toDate (YYYY-MM-DD); optional serviceProvidedIds (comma-separated ints).
 * Aggregates service_counts.count by countDate (and by service when ids are provided).
 */
exports.serviceCountsTimeseries = async (req, res) => {
  try {
    const fromDate = req.query.fromDate?.trim();
    const toDate = req.query.toDate?.trim();
    if (!fromDate || !toDate) {
      return res.status(400).send({ message: "fromDate and toDate are required (YYYY-MM-DD)." });
    }

    const scope = getClientTenantScope(req);
    const labels = eachDateInRange(fromDate, toDate);
    if (scope.mode === "none") {
      const zeros = labels.map(() => 0);
      return res.send({
        labels,
        datasets: [
          {
            label: "Service counts (total)",
            data: [...zeros],
            backgroundColor: SERVICE_COUNT_CHART_COLORS[0],
          },
        ],
      });
    }

    const idParts = (req.query.serviceProvidedIds || "")
      .split(",")
      .map((s) => parseInt(String(s).trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);

    let orgClause = "";
    const replacements = { fromDate, toDate };
    if (scope.mode === "scoped") {
      orgClause = " AND loc.organizationId = :orgId ";
      replacements.orgId = scope.organizationId;
    }

    if (idParts.length === 0) {
      const sql = `
        SELECT DATE(sc.countDate) AS activityDate, SUM(sc.count) AS cnt
        FROM service_counts sc
        INNER JOIN locations loc ON loc.id = sc.locationId
        WHERE sc.countDate BETWEEN :fromDate AND :toDate
          ${orgClause}
        GROUP BY DATE(sc.countDate)
        ORDER BY activityDate ASC
      `;
      const rows = await sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT,
      });
      const byDate = new Map();
      for (const r of rows) {
        const ad = r.activityDate ?? r.activitydate;
        const d = ad instanceof Date ? ad.toISOString().slice(0, 10) : String(ad).slice(0, 10);
        const cnt = Number(r.cnt ?? r.CNT) || 0;
        byDate.set(d, (byDate.get(d) || 0) + cnt);
      }
      const data = labels.map((label) => byDate.get(label) ?? 0);
      return res.send({
        labels,
        datasets: [
          {
            label: "All services (total)",
            data,
            backgroundColor: SERVICE_COUNT_CHART_COLORS[0],
          },
        ],
      });
    }

    const inList = idParts.join(",");
    const sql = `
      SELECT DATE(sc.countDate) AS activityDate, sc.serviceProvidedId AS sid, lk.value AS serviceLabel, SUM(sc.count) AS cnt
      FROM service_counts sc
      INNER JOIN locations loc ON loc.id = sc.locationId
      INNER JOIN lookups lk ON lk.id = sc.serviceProvidedId AND lk.type = 'service_provided'
      WHERE sc.countDate BETWEEN :fromDate AND :toDate
        ${orgClause}
        AND sc.serviceProvidedId IN (${inList})
      GROUP BY DATE(sc.countDate), sc.serviceProvidedId, lk.value
      ORDER BY activityDate ASC, sid ASC
    `;

    const rows = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const labelBySid = new Map();
    const byDateSid = new Map();
    for (const r of rows) {
      const ad = r.activityDate ?? r.activitydate;
      const d = ad instanceof Date ? ad.toISOString().slice(0, 10) : String(ad).slice(0, 10);
      const sid = Number(r.sid ?? r.SID);
      if (!Number.isNaN(sid)) {
        const lbl = r.serviceLabel ?? r.servicelabel;
        if (lbl != null && lbl !== "" && !labelBySid.has(sid)) {
          labelBySid.set(sid, String(lbl));
        }
        const key = `${d}|${sid}`;
        const cnt = Number(r.cnt ?? r.CNT) || 0;
        byDateSid.set(key, (byDateSid.get(key) || 0) + cnt);
      }
    }

    /** Raw SQL may omit labels (e.g. driver casing); selected services with no rows in range never appear in `rows`. */
    const lookupRows = await Lookup.findAll({
      where: { id: { [Op.in]: idParts }, type: "service_provided" },
      attributes: ["id", "value"],
    });
    for (const lk of lookupRows) {
      const id = Number(lk.id);
      const v = String(lk.value ?? "").trim();
      if (v) labelBySid.set(id, v);
    }

    const datasets = idParts.map((sid, idx) => {
      const data = labels.map((label) => byDateSid.get(`${label}|${sid}`) ?? 0);
      return {
        label: labelBySid.get(sid) || `Service ${sid}`,
        data,
        backgroundColor: SERVICE_COUNT_CHART_COLORS[idx % SERVICE_COUNT_CHART_COLORS.length],
      };
    });

    return res.send({ labels, datasets });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

export default exports;
