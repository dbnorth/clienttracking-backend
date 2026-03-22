import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Location = SequelizeInstance.define(
  "location",
  {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    organizationId: { type: Sequelize.INTEGER, allowNull: false },
    name: { type: Sequelize.STRING(255), allowNull: false },
    address: { type: Sequelize.STRING(500) },
    city: { type: Sequelize.STRING(100) },
    state: { type: Sequelize.STRING(50) },
    zip: { type: Sequelize.STRING(20) },
    contactName: { type: Sequelize.STRING(255) },
    phoneNumber: { type: Sequelize.STRING(50) },
  },
  { tableName: "locations" }
);

export default Location;
