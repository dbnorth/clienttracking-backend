/**
 * Canonical lookup rows from the original seedLookups script (no organizationId — legacy global seed).
 * Per-organization starter sets use {@link starterSetLookupTemplates}.
 */
export const LEGACY_GLOBAL_LOOKUP_SEED = [
  { type: "referring_organization_type", value: "Service organization", sortOrder: 1, status: "Active" },
  { type: "referring_organization_type", value: "Correctional facility", sortOrder: 2, status: "Active" },
  { type: "referring_organization_type", value: "Government agency", sortOrder: 3, status: "Active" },
  { type: "referring_organization_type", value: "Nonprofit", sortOrder: 4, status: "Active" },
  { type: "referring_organization_type", value: "Healthcare provider", sortOrder: 5, status: "Active" },
  { type: "referral_type", value: "Organization", sortOrder: 1, status: "Active" },
  { type: "referral_type", value: "Agency referral", sortOrder: 2, status: "Active" },
  { type: "referral_type", value: "Walk-in", sortOrder: 3, status: "Active" },
  { type: "referral_type", value: "Word of mouth", sortOrder: 4, status: "Active" },
  { type: "referral_type", value: "Court-ordered", sortOrder: 5, status: "Active" },
  { type: "referral_type", value: "Self-referral", sortOrder: 6, status: "Active" },
  { type: "drug_of_choice", value: "Alcohol", sortOrder: 1, status: "Active" },
  { type: "drug_of_choice", value: "Methamphetamine", sortOrder: 2, status: "Active" },
  { type: "drug_of_choice", value: "Opioids", sortOrder: 3, status: "Active" },
  { type: "drug_of_choice", value: "Cocaine", sortOrder: 4, status: "Active" },
  { type: "race", value: "American Indian or Alaska Native", sortOrder: 1, status: "Active" },
  { type: "race", value: "Asian", sortOrder: 2, status: "Active" },
  { type: "race", value: "Black or African American", sortOrder: 3, status: "Active" },
  { type: "race", value: "Native Hawaiian or Other Pacific Islander", sortOrder: 4, status: "Active" },
  { type: "race", value: "White", sortOrder: 5, status: "Active" },
  { type: "race", value: "Two or More Races", sortOrder: 6, status: "Active" },
  { type: "race", value: "Prefer not to say", sortOrder: 7, status: "Active" },
  { type: "ethnicity", value: "Hispanic or Latino", sortOrder: 1, status: "Active" },
  { type: "ethnicity", value: "Not Hispanic or Latino", sortOrder: 2, status: "Active" },
  { type: "ethnicity", value: "Prefer not to say", sortOrder: 3, status: "Active" },
  { type: "gender", value: "Male", sortOrder: 1, status: "Active" },
  { type: "gender", value: "Female", sortOrder: 2, status: "Active" },
  { type: "gender", value: "Non-binary", sortOrder: 3, status: "Active" },
  { type: "gender", value: "Prefer not to say", sortOrder: 4, status: "Active" },
  { type: "gender", value: "Other", sortOrder: 5, status: "Active" },
  { type: "initial_situation", value: "Homeless", sortOrder: 1, status: "Active" },
  { type: "initial_situation", value: "Just Released", sortOrder: 2, status: "Active" },
  { type: "housing_type", value: "Shelter", sortOrder: 1, status: "Active" },
  { type: "housing_type", value: "Transitional", sortOrder: 2, status: "Active" },
  { type: "housing_type", value: "Permanent", sortOrder: 3, status: "Active" },
  { type: "housing_type", value: "Unsheltered", sortOrder: 4, status: "Active" },
  { type: "housing_location", value: "Address", sortOrder: 1, status: "Active" },
  { type: "housing_location", value: "Downtown", sortOrder: 2, status: "Active" },
  { type: "housing_location", value: "North Side", sortOrder: 3, status: "Active" },
  { type: "housing_location", value: "South Side", sortOrder: 4, status: "Active" },
  { type: "housing_location", value: "East Side", sortOrder: 5, status: "Active" },
  { type: "benefit", value: "Sooner Care", sortOrder: 1, status: "Active" },
  { type: "benefit", value: "Food Stamps", sortOrder: 2, status: "Active" },
  { type: "benefit", value: "SSI", sortOrder: 3, status: "Active" },
  { type: "benefit", value: "SSDI", sortOrder: 4, status: "Active" },
  { type: "benefit", value: "Retirement", sortOrder: 5, status: "Active" },
  { type: "service_provided", value: "Meal", sortOrder: 1, status: "Active" },
  { type: "service_provided", value: "Counseling", sortOrder: 2, status: "Active" },
  { type: "service_provided", value: "Transportation", sortOrder: 3, status: "Active" },
  { type: "service_provided", value: "Case Management", sortOrder: 4, status: "Active" },
  { type: "encounter_type", value: "In Person", sortOrder: 1, status: "Active" },
  { type: "encounter_type", value: "Phone", sortOrder: 2, status: "Active" },
  { type: "encounter_type", value: "No Contact", sortOrder: 3, status: "Active" },
];

/** Lookup types included in Admin “Load starter set” (matches seed subset for forms). */
export const STARTER_SET_LOOKUP_TYPES = new Set([
  "referring_organization_type",
  "referral_type",
  "drug_of_choice",
  "race",
  "ethnicity",
  "gender",
  "initial_situation",
  "housing_type",
  "benefit",
  "encounter_type",
]);

export const starterSetLookupTemplates = LEGACY_GLOBAL_LOOKUP_SEED.filter((r) =>
  STARTER_SET_LOOKUP_TYPES.has(r.type)
);

/** Sample referring org from original seed (per tenant organization). */
export const starterSetReferringOrganizationTemplates = [
  { name: "Sample Referring Organization", caseWorkerName: "Jane Smith", phone: "555-123-4567" },
];
