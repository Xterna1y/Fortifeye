import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import scanRoutes from "../modules/scan/scan.routes.js";
import sandboxRoutes from "../modules/sandbox/sandbox.routes.js";
import guardianRoutes from "../modules/guardian/guardian.routes.js";
import alertRoutes from "../modules/alerts/alert.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/scan", scanRoutes);
router.use("/sandbox", sandboxRoutes);
router.use("/guardian", guardianRoutes);
router.use("/alerts", alertRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
