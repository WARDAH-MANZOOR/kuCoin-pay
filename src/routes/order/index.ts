
import { orderController
 } from "../../controllers/index.js";
import { Router } from "express";

const router = Router();


router.post("/create", orderController.createOrder);
router.post("/query", orderController.queryOrder);
router.post("/queryList", orderController.queryOrderList);
router.post("/close", orderController.closeOrder);
export default router;