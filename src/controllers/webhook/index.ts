import axios from "axios";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { sign } from "../../utils/signature.js";

const prisma = new PrismaClient();



export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const timestamp = req.headers("PAY-API-TIMESTAMP");
    const signature = req.headers("PAY-API-SIGN");
    const version = req.headers("PAY-API-VERSION");
    const body = req.body as any;

    console.log("📩 KuCoin Webhook:", { headers: req.headers, body });

    // 1) Verify signature
    const isValid = verifyKucoinWebhookSignature(body, timestamp!, signature!);

    if (!isValid) {
      console.error("❌ Invalid KuCoin webhook signature");
      return res.status(400).send("invalid signature");
    }

    // 2) Handle by type
    await handleKucoinWebhookEvent(body);

    // 3) Always return 200 if processed (even if you ignore some events)
    return res.status(200).send("ok");
  } catch (e: any) {
    console.error("❌ Webhook error:", e);
    // Agar code crash ho gaya to KuCoin dobara bhejega (non-200)
    return res.status(500).send("error");
  }
};

export default {

}