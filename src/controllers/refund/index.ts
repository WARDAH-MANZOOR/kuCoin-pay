
import { Request, Response } from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { buildSignatureString, sign } from "../../utils/signature.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Refund Order Controller - Chapter 3.5
 * Initiates a refund (full or partial) for a KuCoin Pay order.
 */
export const refundOrder = async (req: Request, res: Response) => {
  try {
    const timestamp = Date.now();
    const { payID, refundAmount, refundReason, requestId, subMerchantId, reference } = req.body;

    // Validate inputs
    if (!payID || !refundAmount || !requestId) {
      console.warn("⚠️ Missing required fields:", req.body);
      return res.status(400).json({
        success: false,
        error: "payID, refundAmount, and requestId are required.",
      });
    }

    // 🔹 Step 1: Prepare params for signature (per Chapter 3.5)
    const params = {
      apiKey: process.env.KUCOIN_API_KEY,
      payID,
      refundAmount,
      refundReason: refundReason || "",
      requestId,
      subMerchantId: subMerchantId || "",
      timestamp,
    };
    console.log("🧩 Step 1: Params prepared =>", params);

    // 🔹 Step 2: Build signature string
    const signString = Object.entries(params)
      .filter(([_, v]) => v !== "" && v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    console.log("🧾 Step 2: Signature string =>", signString);

    // 🔹 Step 3: Load private key
    const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);

    // 🔹 Step 4: Generate signature
    const signature = sign(signString, privateKey);
    console.log("🧠 Step 4: Signature (first 60 chars):", signature.slice(0, 60) + "...");

    // 🔹 Step 5: Headers
    const headers = {
      "PAY-API-SIGN": signature,
      "PAY-API-KEY": process.env.KUCOIN_API_KEY,
      "PAY-API-VERSION": "1.0",
      "PAY-API-TIMESTAMP": timestamp.toString(),
      "Content-Type": "application/json",
    };
    console.log("📦 Step 5: Headers =>", headers);

    // 🔹 Step 6: Body
    const body = { payID, refundAmount, refundReason, requestId, subMerchantId, reference };
    console.log("🧰 Step 6: Body =>", JSON.stringify(body, null, 2));

    // 🔹 Step 7: Send request
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/refund/create`;
    console.log("🚀 Step 7: Sending refund request to KuCoin API...");
    console.log("➡️ Endpoint:", endpoint);

    const response = await axios.post(endpoint, body, { headers });
    console.log("✅ Step 8: KuCoin API response =>", response.data);

    // 🔹 Step 9: Save refund
    await prisma.refund.create({
      data: {
        refundRequestId: requestId,
        payOrderId: payID,
        refundAmount: parseFloat(refundAmount),
        refundReason: refundReason || "N/A",
        status: response.data?.success ? "SUCCESS" : "PENDING",
        kucoinRefundId: response.data?.data?.refundId || null,
      },
    });
    console.log("💾 Step 9: Refund saved in DB.");

    // 🔹 Step 10: Update order status
    if (response.data?.success) {
      await prisma.order.updateMany({
        where: { kucoinOrderId: payID },
        data: { status: "REFUNDED" },
      });
      console.log("💾 Step 10: Order marked REFUNDED.");
    }

    // 🔹 Step 11: Response
    res.status(200).json({
      success: true,
      message: "Refund request processed successfully",
      data: response.data,
    });
  } catch (err: any) {
    console.error("❌ Error processing refund:", err.message);
    if (err.response) {
      console.error("📩 KuCoin Response Data:", err.response.data);
      console.error("📄 KuCoin Response Headers:", err.response.headers);
      console.error("🌐 KuCoin Response Status:", err.response.status);
    }
    res.status(500).json({
      success: false,
      error: err.message || "Internal Server Error",
    });
  }
};

export default {

  refundOrder
};
