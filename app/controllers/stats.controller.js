import { QueryTypes } from "sequelize";
import db from "../models/index.js";
import { getClientTenantScope } from "../authorization/tenantScope.js";

const sequelize = db.sequelize;

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

export default exports;
