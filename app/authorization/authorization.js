import db from "../models/index.js";
import logger from "../config/logger.js";

const Session = db.session;
const User = db.user;

const authenticate = (req, res, next) => {
  const authHeader = req.get("authorization");
  if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized! No Auth Header" });
  }
  const token = authHeader.slice(7);
  Session.findOne({
    where: { token },
    include: [{ model: User, attributes: ["id", "role", "organizationId"] }],
  })
    .then((session) => {
      if (session != null && session.expirationDate >= Date.now()) {
        const u = session.user;
        if (u) {
          req.user = {
            id: u.id,
            role: u.role,
            organizationId: u.organizationId,
          };
        } else {
          req.user = null;
        }
        next();
        return;
      }
      return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
    })
    .catch((err) => {
      logger.error(`Authentication error: ${err.message}`);
      return res.status(500).send({ message: "Error during authentication" });
    });
};

const isAdminLike = (role) => role === "admin" || role === "superadmin";

export const requireAdmin = (req, res, next) => {
  if (!isAdminLike(req.user?.role)) {
    return res.status(403).send({ message: "Forbidden. Admin role required." });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).send({ message: "Forbidden. Superadmin role required." });
  }
  next();
};

export default authenticate;
