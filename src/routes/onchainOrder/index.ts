
import { onchainOrderController
 } from "../../controllers/index.js";
import { Router } from "express";

const router = Router();


router.post("/create", onchainOrderController.createOnchainOrder);

export default router;