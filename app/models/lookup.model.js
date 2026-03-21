import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Lookup = SequelizeInstance.define("lookup", {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  type: { type: Sequelize.STRING(50), allowNull: false },
  value: { type: Sequelize.STRING(255), allowNull: false },
  sortOrder: { type: Sequelize.INTEGER, defaultValue: 0 },
  status: { type: Sequelize.STRING(20), defaultValue: "Active" },
});

export default Lookup;
