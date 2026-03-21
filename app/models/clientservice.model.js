import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ClientService = SequelizeInstance.define(
  "clientservice",
  {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    clientId: { type: Sequelize.INTEGER, allowNull: false },
    locationId: { type: Sequelize.INTEGER },
    serviceProvidedId: { type: Sequelize.INTEGER },
    encounterRequestedId: { type: Sequelize.INTEGER },
    requestedDate: { type: Sequelize.DATEONLY },
    encounterProvidedId: { type: Sequelize.INTEGER },
    providedDate: { type: Sequelize.DATEONLY },
    cancelledDate: { type: Sequelize.DATEONLY },
    status: {
      type: Sequelize.ENUM("requested", "provided", "cancelled"),
      allowNull: false,
      defaultValue: "requested",
    },
  },
  { tableName: "clientservices" }
);

export default ClientService;
