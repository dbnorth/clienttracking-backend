import routes from "./app/routes/index.js";
import express, { json, urlencoded } from "express";
import cors from "cors";
import morgan from "morgan";

import db from "./app/models/index.js";
import logger from "./app/config/logger.js";

db.sequelize.sync();

const app = express();

app.use(morgan("combined", { stream: logger.stream }));

var corsOptions = {
  origin: "http://localhost:8082",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/clienttracking", routes);

const PORT = process.env.PORT || 3200;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`Client Tracking Server is running on port ${PORT}`);
  });
}

export { logger };
export default app;
