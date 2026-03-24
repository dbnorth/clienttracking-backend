import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ReferringOrganization = SequelizeInstance.define(
  "referringOrganization",
  {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING(255), allowNull: false },
    caseWorkerName: { type: Sequelize.STRING(255) },
    phone: { type: Sequelize.STRING(50) },
    referringOrganizationTypeId: { type: Sequelize.INTEGER },
    organizationId: { type: Sequelize.INTEGER, allowNull: true },
  },
  { tableName: "referring_organizations" }
);

export default ReferringOrganization;
