import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const User = SequelizeInstance.define(
  "user",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fName: { type: Sequelize.STRING, allowNull: false },
    lName: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: true, unique: true },
    username: { type: Sequelize.STRING(100), allowNull: false, unique: true },
    password: { type: Sequelize.STRING(255), allowNull: false },
    organizationId: { type: Sequelize.INTEGER },
    role: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "worker" },
  },
  {
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
  }
);

export default User;
