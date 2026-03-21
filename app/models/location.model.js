import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Location = SequelizeInstance.define(
  "location",
  {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    organizationId: { type: Sequelize.INTEGER, allowNull: false },
    name: { type: Sequelize.STRING(255), allowNull: false },
    address: { type: Sequelize.STRING(500) },
    contactName: { type: Sequelize.STRING(255) },
    phoneNumber: { type: Sequelize.STRING(50) },
  },
  { tableName: "locations" }
);

export default Location;
