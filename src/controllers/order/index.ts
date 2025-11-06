import { Request, Response } from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { buildSignatureString, sign } from "../../utils/signature.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Create Order Controller - fully dynamic version (per Chapter 3)
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const timestamp = Date.now();

    // 🔹 Validate required fields from user
    const {
      orderAmount,
      orderCurrency,
      reference,
      source,
      subMerchantId,
      expireTime,
      goods,
      returnUrl,
      cancelUrl,
    } = req.body;

    if (!orderAmount || !orderCurrency || !goods || !returnUrl || !cancelUrl) {
      console.warn("⚠️ Missing required fields in request body:", req.body);
      return res.status(400).json({
        error:
          "Missing required fields: orderAmount, orderCurrency, goods, returnUrl, cancelUrl are mandatory.",
      });
    }

    // 🔹 Prepare all params (as per Chapter 3)
    const params = {
      apiKey: process.env.KUCOIN_API_KEY,
      expireTime: expireTime || 1800000, // default 30 min if not provided
      orderAmount,
      orderCurrency,
      reference: reference || "no-ref",
      requestId: "req-" + Date.now(),
      source: source || "WEB",
      subMerchantId: subMerchantId || "Default-SubMerchant",
      timestamp,
    };

    console.log("🧩 Step 1: Params prepared =>", params);

    // 1️⃣ Build signature string
    const signString = buildSignatureString(params);
    console.log("🧾 Step 2: Signature string =>", signString);

    // 2️⃣ Read merchant private key
    const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);

    // 3️⃣ Generate signature
    const signature = sign(signString, privateKey);
    console.log("🧠 Step 4: Generated signature (first 60 chars) =>", signature.slice(0, 60) + "...");

    // 4️⃣ Prepare request headers (per Chapter 2.1)
    const headers = {
      "PAY-API-SIGN": signature,
      "PAY-API-KEY": process.env.KUCOIN_API_KEY,
      "PAY-API-VERSION": "1.0",
      "PAY-API-TIMESTAMP": timestamp.toString(),
      "Content-Type": "application/json",
    };

    console.log("📦 Step 5: Request headers =>", headers);

    // 5️⃣ Construct body dynamically
    const body = {
      expireTime: params.expireTime,
      goods, // expected to be an array of { goodsId, goodsName, goodsDesc }
      orderAmount,
      orderCurrency,
      reference: params.reference,
      requestId: params.requestId,
      returnUrl,
      cancelUrl,
      source: params.source,
      subMerchantId: params.subMerchantId,
    };

    console.log("🧰 Step 6: Request body =>", JSON.stringify(body, null, 2));

    // 6️⃣ Send request to KuCoin Pay
    console.log("🚀 Step 7: Sending request to KuCoin API...");
    console.log("➡️ Endpoint:", `${process.env.KUCOIN_BASE_URL}/api/v1/order/create`);

    const response = await axios.post(
      `${process.env.KUCOIN_BASE_URL}/api/v1/order/create`,
      body,
      { headers }
    );

    console.log("✅ Step 8: KuCoin API response =>", response.data);

    // 7️⃣ Save order in DB
    const order = await prisma.order.create({
      data: {
        requestId: params.requestId,
        orderAmount: parseFloat(orderAmount),
        orderCurrency,
        reference,
        source,
        subMerchantId,
        expireTime,
        kucoinOrderId: response.data.data?.payOrderId || null,
        qrcodeUrl: response.data.data?.qrcode || null,
        appPayUrl: response.data.data?.appPayUrl || null,
        status: "CREATED",
      },
    });

    console.log("💾 Step 9: Order saved to database =>", order);

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: response.data,
    });
  } catch (err: any) {
    console.error("❌ Error creating order:", err.message);
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


/**
 * Query Order Controller - Chapter 3.2
 * Queries order status and details from KuCoin Pay
 */
export const queryOrder = async (req: Request, res: Response) => {
  try {
    const timestamp = Date.now();

    // 🔹 Extract from request body (either payOrderId or requestId required)
    const { payOrderId, requestId } = req.body;

    if (!payOrderId && !requestId) {
      console.warn("⚠️ Missing payOrderId/requestId:", req.body);
      return res.status(400).json({
        success: false,
        error: "Either payOrderId or requestId must be provided.",
      });
    }

    // 🔹 Prepare params as per Chapter 3.2 signature rule
    const params = {
      apiKey: process.env.KUCOIN_API_KEY,
      payOrderId: payOrderId || "",
      requestId: requestId || "",
      timestamp,
    };

    console.log("🧩 Step 1: Params prepared =>", params);

    // 1️⃣ Build signature string (apiKey, payOrderId, requestId, timestamp)
    const signString = [
      `apiKey=${params.apiKey}`,
      params.payOrderId ? `payOrderId=${params.payOrderId}` : null,
      params.requestId ? `requestId=${params.requestId}` : null,
      `timestamp=${params.timestamp}`,
    ]
      .filter(Boolean)
      .join("&");

    console.log("🧾 Step 2: Signature string =>", signString);

    // 2️⃣ Load merchant private key
    const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);

    // 3️⃣ Generate signature
    const signature = sign(signString, privateKey);
    console.log(
      "🧠 Step 4: Generated signature (first 60 chars) =>",
      signature.slice(0, 60) + "..."
    );

    // 4️⃣ Prepare headers
    const headers = {
      "PAY-API-SIGN": signature,
      "PAY-API-KEY": process.env.KUCOIN_API_KEY,
      "PAY-API-VERSION": "1.0",
      "PAY-API-TIMESTAMP": timestamp.toString(),
      "Content-Type": "application/json",
    };

    console.log("📦 Step 5: Request headers =>", headers);

    // 5️⃣ Build request body
    const body: { payOrderId?: string; requestId?: string } = {};
    if (payOrderId) body["payOrderId"] = payOrderId;
    if (requestId) body["requestId"] = requestId;

    console.log("🧰 Step 6: Request body =>", JSON.stringify(body, null, 2));

    // 6️⃣ Call KuCoin API
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/order/info`;
    console.log("🚀 Step 7: Sending request to KuCoin API...");
    console.log("➡️ Endpoint:", endpoint);

    const response = await axios.post(endpoint, body, { headers });

    console.log("✅ Step 8: KuCoin API response =>", response.data);

    // 7️⃣ Update order status in DB if present
    if (response.data?.data?.payOrderId) {
      await prisma.order.updateMany({
        where: {
          OR: [
            { kucoinOrderId: response.data.data.payOrderId },
            { requestId: response.data.data.requestId },
          ],
        },
        data: { status: response.data.data.status || "UNKNOWN" },
      });
      console.log("💾 Step 9: Order status updated in database");
    }

    res.status(200).json({
      success: true,
      message: "Order query successful",
      data: response.data,
    });
  } catch (err: any) {
    console.error("❌ Error querying order:", err.message);
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
  createOrder,
  queryOrder
};
