import { refundController } from "../../controllers/index.js";
import { Router } from "express";
const router = Router();
router.post("/", refundController.refundOrder);
export default router;
