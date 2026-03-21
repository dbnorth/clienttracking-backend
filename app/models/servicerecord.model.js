import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ServiceRecord = SequelizeInstance.define("servicerecord", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  clientId: { type: Sequelize.INTEGER, allowNull: false },
  date: { type: Sequelize.DATEONLY, allowNull: false },
  serviceProvidedId: { type: Sequelize.INTEGER, allowNull: false },
});

export default ServiceRecord;
