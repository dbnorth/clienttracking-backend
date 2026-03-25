import routes from "./app/routes/index.js";
import express, { json, urlencoded } from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import db from "./app/models/index.js";
import logger from "./app/config/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Default `sync()` only creates missing tables — it does NOT add new columns to existing tables.
 * Set SEQUELIZE_SYNC_ALTER=true to run `sync({ alter: true })`, which aligns tables with models
 * (adds columns, may change column types). Use with care in production; prefer migrations for prod.
 */
const syncOptions =
  process.env.SEQUELIZE_SYNC_ALTER === "true" || process.env.SEQUELIZE_SYNC_ALTER === "1"
    ? { alter: true }
    : {};

db.sequelize
  .sync(syncOptions)
  .then(() => {
    if (syncOptions.alter) {
      logger.info("Database sync completed with alter: true (schema may have been updated).");
    }
  })
  .catch((err) => {
    logger.error(`Database sync failed: ${err.message}`);
    process.exit(1);
  });

const app = express();

app.use(morgan("combined", { stream: logger.stream }));

var corsOptions = {
  origin: "http://localhost:8082",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/clienttracking/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/clienttracking", routes);

const PORT = process.env.PORT || 3200;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`Client Tracking Server is running on port ${PORT}`);
  });
}

export { logger };
export default app;
