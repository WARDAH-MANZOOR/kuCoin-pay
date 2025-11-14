import { PrismaClient } from "@prisma/client";
import { verifyKucoinWebhookSignature } from "../../utils/signature.js";
import { webhookService } from "services/index.js";
const prisma = new PrismaClient();
export const handleWebhook = async (req, res) => {
    try {
        const timestamp = req.get("PAY-API-TIMESTAMP");
        const signature = req.get("PAY-API-SIGN");
        const version = req.get("PAY-API-VERSION");
        const body = req.body;
        console.log("📩 KuCoin Webhook:", { headers: req.headers, body });
        // 1) Verify signature
        const isValid = verifyKucoinWebhookSignature(body, timestamp, signature);
        if (!isValid) {
            console.error("❌ Invalid KuCoin webhook signature");
            return res.status(400).send("invalid signature");
        }
        // 2) Handle by type
        await webhookService.handleKucoinWebhookEvent(body);
        // 3) Always return 200 if processed (even if you ignore some events)
        return res.status(200).send("ok");
    }
    catch (e) {
        console.error("❌ Webhook error:", e);
        // Agar code crash ho gaya to KuCoin dobara bhejega (non-200)
        return res.status(500).send("error");
    }
};
export default {
    handleWebhook
};
