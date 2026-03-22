import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Organization = SequelizeInstance.define("organization", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: Sequelize.STRING(255), allowNull: false },
  contactName: { type: Sequelize.STRING(255) },
  phoneNumber: { type: Sequelize.STRING(50) },
  street: { type: Sequelize.STRING(255) },
  city: { type: Sequelize.STRING(100) },
  state: { type: Sequelize.STRING(50) },
  zip: { type: Sequelize.STRING(20) },
  logoUrl: { type: Sequelize.STRING(500) },
  primaryColor: { type: Sequelize.STRING(20) },
});

export default Organization;
