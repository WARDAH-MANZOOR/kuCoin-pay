import express from "express";
import { onchainRefundController } from "../../controllers/index.js";
const router = express.Router();
// POST /api/v1/onchain/refund/create
router.post("/create", onchainRefundController.createOnchainRefundOrder);
export default router;
