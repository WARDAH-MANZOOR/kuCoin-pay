
import { onchainOrderController
 } from "../../controllers/index.js";
import { Router } from "express";

const router = Router();


router.post("/create", onchainOrderController.createOnchainOrder);
router.post("/query", onchainOrderController.queryOnchainOrder);
router.post("/queryList", onchainOrderController.queryOnchainOrderList);

export default router;