import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ServiceCount = SequelizeInstance.define(
  "serviceCount",
  {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    locationId: { type: Sequelize.INTEGER, allowNull: false },
    serviceProvidedId: { type: Sequelize.INTEGER, allowNull: false },
    countDate: { type: Sequelize.DATEONLY, allowNull: false },
    count: { type: Sequelize.INTEGER, allowNull: false },
  },
  { tableName: "service_counts" }
);

export default ServiceCount;
