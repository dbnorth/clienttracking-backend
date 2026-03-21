import db from "../models/index.js";
import logger from "../config/logger.js";

const Session = db.session;

const authenticate = (req, res, next) => {
  let token = null;
  let authHeader = req.get("authorization");
  if (authHeader != null && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
    Session.findAll({ where: { token: token } })
      .then((data) => {
        let session = data[0];
        if (session != null && session.expirationDate >= Date.now()) {
          next();
          return;
        }
        return res.status(401).send({ message: "Unauthorized! Invalid or expired token." });
      })
      .catch((err) => {
        logger.error(`Authentication error: ${err.message}`);
        return res.status(500).send({ message: "Error during authentication" });
      });
  } else {
    return res.status(401).send({ message: "Unauthorized! No Auth Header" });
  }
};

export default authenticate;
