
import { payoutOrderController
 } from "../../controllers/index.js";
import { Router } from "express";

const router = Router();

router.post("/", payoutOrderController.createPayoutOrder);


export default router;