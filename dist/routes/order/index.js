import { orderController } from "../../controllers/index.js";
import { Router } from "express";
const router = Router();
router.post("/create", orderController.createOrder);
export default router;
