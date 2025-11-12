import { payoutOrderController } from "../../controllers/index.js";
import { Router } from "express";
const router = Router();
router.post("/create", payoutOrderController.createPayoutOrder);
router.post("/query", payoutOrderController.queryPayoutInfo);
router.post("/detail", payoutOrderController.queryPayoutDetail);
router.post("/onchain-currency", payoutOrderController.queryOnchainCurrency);
router.post("/onchain-currency-quote", payoutOrderController.queryOnchainCurrencyQuote);
export default router;
