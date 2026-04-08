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
  currentSituationId: { type: Sequelize.INTEGER },
  currentlyTakingDrugs: { type: Sequelize.BOOLEAN, defaultValue: false },
  housingTypeId: { type: Sequelize.INTEGER },
  housingRedGreen: { type: Sequelize.STRING(20) },
  housingLocationId: { type: Sequelize.INTEGER },
  daytimeLocationId: { type: Sequelize.INTEGER },
  /** Snapshot; saved encounter updates client.phone the same as other snapshot fields. */
  phone: { type: Sequelize.STRING(50) },
  housingStreet: { type: Sequelize.STRING(255) },
  housingApt: { type: Sequelize.STRING(50) },
  housingCity: { type: Sequelize.STRING(100) },
  housingState: { type: Sequelize.STRING(50) },
  housingZip: { type: Sequelize.STRING(20) },
});

export default Encounter;
