import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ClientDocument = SequelizeInstance.define(
  "clientDocument",
  {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    clientId: { type: Sequelize.INTEGER, allowNull: false },
    documentType: {
      type: Sequelize.ENUM(
        "drivers_license",
        "birth_certificate",
        "social_security_card",
        "misc"
      ),
      allowNull: false,
    },
    miscDescription: { type: Sequelize.STRING(500), allowNull: true },
    filePath: { type: Sequelize.STRING(500), allowNull: false },
    originalFilename: { type: Sequelize.STRING(255), allowNull: true },
    mimeType: { type: Sequelize.STRING(100), allowNull: true },
    dateAdded: { type: Sequelize.DATEONLY, allowNull: false },
  },
  { tableName: "client_documents" }
);

export default ClientDocument;
