import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

import User from "./user.model.js";
import Session from "./session.model.js";
import Lookup from "./lookup.model.js";
import ReferringOrganization from "./referringOrganization.model.js";
import Organization from "./organization.model.js";
import Client from "./client.model.js";
import Encounter from "./encounter.model.js";
import ClientService from "./clientservice.model.js";
import Referral from "./referral.model.js";
import Location from "./location.model.js";
import ClientDocument from "./clientDocument.model.js";
import ServiceCount from "./serviceCount.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.session = Session;
db.lookup = Lookup;
db.referringOrganization = ReferringOrganization;
db.organization = Organization;
db.client = Client;
db.encounter = Encounter;
db.clientService = ClientService;
db.referral = Referral;
db.location = Location;
db.clientDocument = ClientDocument;
db.serviceCount = ServiceCount;

db.user.hasMany(db.session, { foreignKey: { allowNull: false }, onDelete: "CASCADE" });
db.session.belongsTo(db.user, { foreignKey: { allowNull: false }, onDelete: "CASCADE" });

db.organization.hasMany(db.user, { foreignKey: "organizationId", onDelete: "SET NULL" });
db.user.belongsTo(db.organization, { foreignKey: "organizationId", onDelete: "SET NULL" });

db.user.hasMany(db.client, { foreignKey: "userId", onDelete: "CASCADE" });
db.client.belongsTo(db.user, { foreignKey: "userId", onDelete: "CASCADE" });

db.client.belongsTo(db.lookup, { as: "referralType", foreignKey: "referralTypeId" });
db.client.belongsTo(db.lookup, { as: "drugOfChoice", foreignKey: "drugOfChoiceId" });
db.client.belongsTo(db.lookup, { as: "housingType", foreignKey: "housingTypeId" });
db.client.belongsTo(db.lookup, { as: "housingLocation", foreignKey: "housingLocationId" });
db.client.belongsTo(db.lookup, { as: "daytimeLocation", foreignKey: "daytimeLocationId" });
db.client.belongsTo(db.lookup, { as: "race", foreignKey: "raceId" });
db.client.belongsTo(db.lookup, { as: "ethnicity", foreignKey: "ethnicityId" });
db.client.belongsTo(db.lookup, { as: "gender", foreignKey: "genderId" });
db.client.belongsTo(db.lookup, { as: "initialSituation", foreignKey: "initialSituationId" });
db.client.belongsTo(db.referringOrganization, { as: "organization", foreignKey: "organizationId" });
db.client.belongsTo(db.location, { as: "intakeLocation", foreignKey: "intakeLocationId" });

db.client.hasMany(db.clientDocument, { foreignKey: "clientId", onDelete: "CASCADE" });
db.clientDocument.belongsTo(db.client, { foreignKey: "clientId", onDelete: "CASCADE" });

db.referringOrganization.belongsTo(db.lookup, { as: "referringOrganizationType", foreignKey: "referringOrganizationTypeId" });
db.organization.hasMany(db.referringOrganization, { foreignKey: "organizationId", onDelete: "CASCADE" });
db.referringOrganization.belongsTo(db.organization, {
  as: "organization",
  foreignKey: "organizationId",
  onDelete: "CASCADE",
});

db.client.hasMany(db.encounter, { foreignKey: "clientId", onDelete: "CASCADE" });
db.encounter.belongsTo(db.client, { foreignKey: "clientId", onDelete: "CASCADE" });
db.user.hasMany(db.encounter, { foreignKey: "userId", onDelete: "CASCADE" });
db.encounter.belongsTo(db.user, { foreignKey: "userId", onDelete: "CASCADE" });
db.encounter.belongsTo(db.lookup, { as: "encounterType", foreignKey: "encounterTypeId" });

db.client.hasMany(db.clientService, { foreignKey: "clientId", onDelete: "CASCADE" });
db.clientService.belongsTo(db.client, { foreignKey: "clientId", onDelete: "CASCADE" });
db.clientService.belongsTo(db.location, { foreignKey: "locationId", onDelete: "SET NULL" });
db.clientService.belongsTo(db.lookup, { as: "serviceProvided", foreignKey: "serviceProvidedId", onDelete: "SET NULL" });
db.clientService.belongsTo(db.encounter, { as: "encounterRequested", foreignKey: "encounterRequestedId", onDelete: "SET NULL" });
db.clientService.belongsTo(db.encounter, { as: "encounterProvided", foreignKey: "encounterProvidedId", onDelete: "SET NULL" });

db.referringOrganization.hasMany(db.referral, { foreignKey: "referringOrganizationId", onDelete: "CASCADE" });
db.referral.belongsTo(db.referringOrganization, { foreignKey: "referringOrganizationId", onDelete: "CASCADE" });
db.client.hasMany(db.referral, { foreignKey: "clientId", onDelete: "CASCADE" });
db.referral.belongsTo(db.client, { foreignKey: "clientId", onDelete: "CASCADE" });

db.organization.hasMany(db.location, { foreignKey: "organizationId", onDelete: "CASCADE" });
db.location.belongsTo(db.organization, { foreignKey: "organizationId", onDelete: "CASCADE" });

db.location.hasMany(db.serviceCount, { foreignKey: "locationId", onDelete: "CASCADE" });
db.serviceCount.belongsTo(db.location, { as: "location", foreignKey: "locationId", onDelete: "CASCADE" });
db.serviceCount.belongsTo(db.lookup, {
  as: "serviceProvided",
  foreignKey: "serviceProvidedId",
  onDelete: "RESTRICT",
});

db.organization.hasMany(db.lookup, { foreignKey: "organizationId", onDelete: "CASCADE" });
db.lookup.belongsTo(db.organization, { as: "organization", foreignKey: "organizationId", onDelete: "CASCADE" });

export default db;
