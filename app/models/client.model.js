import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Client = SequelizeInstance.define("client", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  firstName: { type: Sequelize.STRING(100) },
  nickname: { type: Sequelize.STRING(100) },
  middleName: { type: Sequelize.STRING(100) },
  lastName: { type: Sequelize.STRING(100) },
  suffix: { type: Sequelize.STRING(20) },
  birthdate: { type: Sequelize.DATEONLY },
  raceId: { type: Sequelize.INTEGER },
  ethnicityId: { type: Sequelize.INTEGER },
  genderId: { type: Sequelize.INTEGER },
  initialSituationId: { type: Sequelize.INTEGER },
  /** Same lookup type as initialSituation (initial_situation); UI label "Current Status". */
  currentSituationId: { type: Sequelize.INTEGER },
  parentFirstName: { type: Sequelize.STRING(100) },
  parentLastName: { type: Sequelize.STRING(100) },
  parentPhone: { type: Sequelize.STRING(50) },
  phone: { type: Sequelize.STRING(50) },
  emergencyContactName: { type: Sequelize.STRING(255), defaultValue: "Delesa Jones" },
  emergencyContactPhone: { type: Sequelize.STRING(50) },
  referralTypeId: { type: Sequelize.INTEGER },
  organizationId: { type: Sequelize.INTEGER },
  intakeLocationId: { type: Sequelize.INTEGER },
  /** @deprecated Legacy single FK; use drugsOfChoice JSON. Kept for DB column / one-time migration reads. */
  drugOfChoiceId: { type: Sequelize.INTEGER },
  drugsOfChoice: { type: Sequelize.TEXT },
  currentlyTakingDrugs: { type: Sequelize.BOOLEAN, defaultValue: false },
  /** Situation screening (household / history). */
  childWelfareSystemCase: { type: Sequelize.BOOLEAN, defaultValue: false },
  fosterCareHistory: { type: Sequelize.BOOLEAN, defaultValue: false },
  juvenileJusticeHistory: { type: Sequelize.BOOLEAN, defaultValue: false },
  everInJailOrPrison: { type: Sequelize.BOOLEAN, defaultValue: false },
  housingTypeId: { type: Sequelize.INTEGER },
  housingRedGreen: { type: Sequelize.STRING(20) },
  housingLocationId: { type: Sequelize.INTEGER },
  daytimeLocationId: { type: Sequelize.INTEGER },
  daytimeLocationOther: { type: Sequelize.STRING(500) },
  housingStreet: { type: Sequelize.STRING(255) },
  housingApt: { type: Sequelize.STRING(50) },
  housingCity: { type: Sequelize.STRING(100) },
  housingState: { type: Sequelize.STRING(50) },
  housingZip: { type: Sequelize.STRING(20) },
  benefits: { type: Sequelize.TEXT },
  status: { type: Sequelize.ENUM("Active", "Lost Contact", "Deceased"), defaultValue: "Active" },
  statusChangeDate: { type: Sequelize.DATEONLY },
  dateOfFirstContact: { type: Sequelize.DATEONLY },
  userId: { type: Sequelize.INTEGER },
  photoUrl: { type: Sequelize.STRING(500) },
});

export default Client;
