import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Encounter = SequelizeInstance.define("encounter", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: Sequelize.DATEONLY, allowNull: false },
  time: { type: Sequelize.TIME },
  userId: { type: Sequelize.INTEGER, allowNull: false },
  clientId: { type: Sequelize.INTEGER, allowNull: false },
  encounterTypeId: { type: Sequelize.INTEGER },
  notes: { type: Sequelize.TEXT },
});

export default Encounter;
