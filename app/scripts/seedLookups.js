import db from "../models/index.js";
import { LEGACY_GLOBAL_LOOKUP_SEED } from "../data/lookupSeedData.js";

const Lookup = db.lookup;
const ReferringOrganization = db.referringOrganization;

const lookupData = LEGACY_GLOBAL_LOOKUP_SEED;

async function seed() {
  await db.sequelize.sync();
  const count = await Lookup.count();
  if (count === 0) {
    await Lookup.bulkCreate(lookupData);
    console.log("Lookup data seeded successfully.");
  }
  const [, created] = await Lookup.findOrCreate({
    where: { type: "referral_type", value: "Organization" },
    defaults: { type: "referral_type", value: "Organization", sortOrder: 1, status: "Active" },
  });
  if (created) {
    console.log("Added 'Organization' referral type.");
  }
  const [, createdAddr] = await Lookup.findOrCreate({
    where: { type: "housing_location", value: "Address" },
    defaults: { type: "housing_location", value: "Address", sortOrder: 1, status: "Active" },
  });
  if (createdAddr) {
    console.log("Added 'Address' housing location.");
  }
  const encounterTypeValues = [
    { type: "encounter_type", value: "In Person" },
    { type: "encounter_type", value: "Phone" },
    { type: "encounter_type", value: "No Contact" },
  ];
  for (const item of encounterTypeValues) {
    const [, created] = await Lookup.findOrCreate({
      where: { type: item.type, value: item.value },
      defaults: { ...item, sortOrder: encounterTypeValues.indexOf(item) + 1, status: "Active" },
    });
    if (created) console.log(`Added '${item.value}' to ${item.type}.`);
  }
  const daytimeLocationValues = [
    { type: "daytime_location", value: "Downtown" },
    { type: "daytime_location", value: "Southwest" },
    { type: "daytime_location", value: "NW Expressway" },
    { type: "daytime_location", value: "Other" },
  ];
  for (const item of daytimeLocationValues) {
    const [, created] = await Lookup.findOrCreate({
      where: { type: item.type, value: item.value },
      defaults: { ...item, sortOrder: daytimeLocationValues.indexOf(item) + 1, status: "Active" },
    });
    if (created) console.log(`Added '${item.value}' to ${item.type}.`);
  }
  const raceEthnicityValues = [
    { type: "race", value: "American Indian or Alaska Native" },
    { type: "race", value: "Asian" },
    { type: "race", value: "Black or African American" },
    { type: "race", value: "Native Hawaiian or Other Pacific Islander" },
    { type: "race", value: "White" },
    { type: "race", value: "Two or More Races" },
    { type: "race", value: "Prefer not to say" },
    { type: "ethnicity", value: "Hispanic or Latino" },
    { type: "ethnicity", value: "Not Hispanic or Latino" },
    { type: "ethnicity", value: "Prefer not to say" },
    { type: "gender", value: "Male" },
    { type: "gender", value: "Female" },
    { type: "gender", value: "Non-binary" },
    { type: "gender", value: "Prefer not to say" },
    { type: "gender", value: "Other" },
    { type: "initial_situation", value: "Homeless" },
    { type: "initial_situation", value: "Just Released" },
  ];
  for (const item of raceEthnicityValues) {
    const [, created] = await Lookup.findOrCreate({
      where: { type: item.type, value: item.value },
      defaults: { ...item, sortOrder: 1, status: "Active" },
    });
    if (created) console.log(`Added '${item.value}' to ${item.type}.`);
  }
  const orgCount = await ReferringOrganization.count();
  if (orgCount === 0) {
    await ReferringOrganization.bulkCreate([
      { name: "Sample Referring Organization", caseWorkerName: "Jane Smith", phone: "555-123-4567" },
    ]);
    console.log("Referring organization data seeded.");
  }
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
