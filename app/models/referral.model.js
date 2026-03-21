import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Referral = SequelizeInstance.define(
  "referral",
  {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    referringOrganizationId: { type: Sequelize.INTEGER, allowNull: false },
    clientId: { type: Sequelize.INTEGER, allowNull: false },
    caseWorkerName: { type: Sequelize.STRING(255) },
    phone: { type: Sequelize.STRING(50) },
    dateOfReferral: { type: Sequelize.DATEONLY, allowNull: false },
  },
  { tableName: "referrals" }
);

export default Referral;
