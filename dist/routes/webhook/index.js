import { webhookController } from "../../controllers/index.js";
import { Router } from "express";
const router = Router();
// src/routes/kucoinWebhookRoutes.ts
router.post("/", webhookController.handleWebhook);
export default router;
