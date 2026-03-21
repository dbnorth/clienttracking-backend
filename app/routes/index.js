import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import ClientRoutes from "./client.routes.js";
import ServiceRecordRoutes from "./servicerecord.routes.js";
import EncounterRoutes from "./encounter.routes.js";
import EncounterListRoutes from "./encounter-list.routes.js";
import ClientServiceRoutes from "./clientservice.routes.js";
import ClientServiceListRoutes from "./clientservice-list.routes.js";
import LookupRoutes from "./lookup.routes.js";
import OrganizationRoutes from "./organization.routes.js";
import ReferringOrganizationRoutes from "./referringOrganization.routes.js";
import LocationRoutes from "./location.routes.js";
import UserRoutes from "./user.routes.js";

const router = Router();

router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/clients", ClientRoutes);
router.use("/clients", ServiceRecordRoutes);
router.use("/clients", EncounterRoutes);
router.use("/encounters", EncounterListRoutes);
router.use("/clients", ClientServiceRoutes);
router.use("/clientservices", ClientServiceListRoutes);
router.use("/lookups", LookupRoutes);
router.use("/organizations", OrganizationRoutes);
router.use("/referring-organizations", ReferringOrganizationRoutes);
router.use("/locations", LocationRoutes);

export default router;
