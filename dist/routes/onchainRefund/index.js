import express from "express";
import { onchainRefundController } from "../../controllers/index.js";
const router = express.Router();
// POST /api/v1/onchain/refund/create
router.post("/create", onchainRefundController.createOnchainRefundOrder);
// POST /api/v1/onchain/refund/info
router.post("/query", onchainRefundController.queryOnchainRefundOrder);
// POST /api/v1/refund/query 
router.post("/queryList", onchainRefundController.queryOnchainRefundOrderList);
export default router;
