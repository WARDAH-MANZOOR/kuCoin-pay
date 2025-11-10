
import { reportController
 } from "../../controllers/index.js";
import { Router } from "express";

const router = Router();
router.post("/reconciliation", reportController.queryReconciliationReports);

export default router;