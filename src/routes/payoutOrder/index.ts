
import { payoutOrderController
 } from "../../controllers/index.js";
import { Router } from "express";

const router = Router();

router.post("/create", payoutOrderController.createPayoutOrder);
router.post("/query", payoutOrderController.queryPayoutInfo);


export default router;