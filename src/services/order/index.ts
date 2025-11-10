import axios from "axios";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { buildSignatureString, sign } from "../../utils/signature.js";

const prisma = new PrismaClient();

/**
 * Service: Create Order (KuCoin Chapter 3--3.1)
 * Handles API signing, sending to KuCoin, and saving in DB.
 */
export const createOrder = async (payload: any) => {
  const timestamp = Date.now();

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
  } = payload;

  // 🔹 Validate required fields
  if (!orderAmount || !orderCurrency || !goods || !returnUrl || !cancelUrl) {
    throw new Error(
      "Missing required fields: orderAmount, orderCurrency, goods, returnUrl, cancelUrl are mandatory."
    );
  }

  // 🔹 Step 1: Prepare params for signature
  const params = {
    apiKey: process.env.KUCOIN_API_KEY,
    expireTime: expireTime || 1800000,
    orderAmount,
    orderCurrency,
    reference: reference || "no-ref",
    requestId: "req-" + Date.now(),
    source: source || "WEB",
    subMerchantId: subMerchantId || "Default-SubMerchant",
    timestamp,
  };
  console.log("🧩 Step 1: Params prepared =>", params);

  // 🔹 Step 2: Build signature string
  const signString = buildSignatureString(params);
  console.log("🧾 Step 2: Signature string =>", signString);

  // 🔹 Step 3: Load private key
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);

  // 🔹 Step 4: Generate signature
  const signature = sign(signString, privateKey);
  console.log(
    "🧠 Step 4: Generated signature (first 60 chars) =>",
    signature.slice(0, 60) + "..."
  );

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
  const body = {
    expireTime: params.expireTime,
    goods,
    orderAmount,
    orderCurrency,
    reference: params.reference,
    requestId: params.requestId,
    returnUrl,
    cancelUrl,
    source: params.source,
    subMerchantId: params.subMerchantId,
  };
  console.log("🧰 Step 6: Body =>", JSON.stringify(body, null, 2));

  // 🔹 Step 7: Send request
  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/order/create`;
  console.log("🚀 Step 7: Sending request to KuCoin API...");
  console.log("➡️ Endpoint:", endpoint);

  const response = await axios.post(endpoint, body, { headers });
  console.log("✅ Step 8: KuCoin API response =>", response.data);

  // 🔹 Step 9: Save in DB
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

  console.log("💾 Step 9: Order saved =>", order);

  return response.data;
};


/**
 * Service: Query Order (KuCoin Pay – Chapter 3.2)
 * Handles KuCoin API call and database update.
 */
export const queryOrder = async (payload: {
  payOrderId?: string;
  requestId?: string;
}) => {
  const timestamp = Date.now();
  const { payOrderId, requestId } = payload;

  if (!payOrderId && !requestId) {
    throw new Error("Either payOrderId or requestId must be provided.");
  }

  // 🔹 Step 1: Prepare parameters
  const params = {
    apiKey: process.env.KUCOIN_API_KEY,
    payOrderId: payOrderId || "",
    requestId: requestId || "",
    timestamp,
  };
  console.log("🧩 Step 1: Params prepared =>", params);

  // 🔹 Step 2: Build signature string
  const signString = [
    `apiKey=${params.apiKey}`,
    params.payOrderId ? `payOrderId=${params.payOrderId}` : null,
    params.requestId ? `requestId=${params.requestId}` : null,
    `timestamp=${params.timestamp}`,
  ]
    .filter(Boolean)
    .join("&");
  console.log("🧾 Step 2: Signature string =>", signString);

  // 🔹 Step 3: Load merchant private key
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);

  // 🔹 Step 4: Generate signature
  const signature = sign(signString, privateKey);
  console.log("🧠 Step 4: Signature (first 60 chars) =>", signature.slice(0, 60) + "...");

  // 🔹 Step 5: Headers
  const headers = {
    "PAY-API-SIGN": signature,
    "PAY-API-KEY": process.env.KUCOIN_API_KEY,
    "PAY-API-VERSION": "1.0",
    "PAY-API-TIMESTAMP": timestamp.toString(),
    "Content-Type": "application/json",
  };
  console.log("📦 Step 5: Headers =>", headers);

  // 🔹 Step 6: Request body
  const body: Record<string, string> = {};
  if (payOrderId) body.payOrderId = payOrderId;
  if (requestId) body.requestId = requestId;
  console.log("🧰 Step 6: Body =>", JSON.stringify(body, null, 2));

  // 🔹 Step 7: Send request to KuCoin
  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/order/info`;
  console.log("🚀 Step 7: Sending request to KuCoin...");
  console.log("➡️ Endpoint:", endpoint);

  const response = await axios.post(endpoint, body, { headers });
  console.log("✅ Step 8: KuCoin API response =>", response.data);

  // 🔹 Step 9: Update DB
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
    console.log("💾 Step 9: Order status updated in DB");
  }

  return response.data;
};
/**
 * Service: Query Order List (KuCoin Pay – Chapter 3.3)
 * Handles KuCoin API call + syncing data into DB.
 * Retrieves a paginated list of orders from KuCoin Pay and syncs them to local DB.
 */
export const queryOrderList = async (payload: any) => {
  const timestamp = Date.now();

  const {
    startTime,
    endTime,
    pageNum = 1,
    pageSize = 10,
    requestIds,
    orderIds,
    status,
  } = payload;

  if (!startTime || !endTime) {
    throw new Error("startTime and endTime are required parameters.");
  }

  // 🔹 Step 1: Prepare params for signature
  const params = {
    apiKey: process.env.KUCOIN_API_KEY,
    startTime,
    endTime,
    timestamp,
  };
  console.log("🧩 Step 1: Params prepared =>", params);

  // 🔹 Step 2: Build signature string (order-sensitive)
  const signString = `apiKey=${params.apiKey}&endTime=${endTime}&startTime=${startTime}&timestamp=${timestamp}`;
  console.log("🧾 Step 2: Signature string =>", signString);

  // 🔹 Step 3: Load merchant private key
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);

  // 🔹 Step 4: Generate signature
  const signature = sign(signString, privateKey);
  console.log("🧠 Step 4: Signature (first 60 chars) =>", signature.slice(0, 60) + "...");

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
  const body: Record<string, any> = { pageNum, pageSize, startTime, endTime };
  if (requestIds) body.requestIds = requestIds;
  if (orderIds) body.orderIds = orderIds;
  if (status) body.status = status;
  console.log("🧰 Step 6: Body =>", JSON.stringify(body, null, 2));

  // 🔹 Step 7: Call KuCoin API
  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/order/query`;
  console.log("🚀 Step 7: Sending request to KuCoin API...");
  console.log("➡️ Endpoint:", endpoint);

  const response = await axios.post(endpoint, body, { headers });
  console.log("✅ Step 8: KuCoin API response =>", response.data);

  // 🔹 Step 9: Sync orders to DB
  const orders = response.data?.data?.items || [];
  if (orders.length > 0) {
    console.log(`💾 Step 9: Syncing ${orders.length} orders to database...`);
    for (const order of orders) {
      await prisma.order.upsert({
        where: { requestId: order.requestId },
        update: {
          status: order.status || "UNKNOWN",
          kucoinOrderId: order.payOrderId || null,
          orderCurrency: order.orderCurrency || "USDT",
          orderAmount: parseFloat(order.orderAmount || "0"),
        },
        create: {
          requestId: order.requestId,
          orderAmount: parseFloat(order.orderAmount || "0"),
          orderCurrency: order.orderCurrency || "USDT",
          reference: order.reference || "",
          subMerchantId: order.subMerchantId || "",
          source: "WEB",
          expireTime: 1800000,
          kucoinOrderId: order.payOrderId || null,
          qrcodeUrl: "",
          appPayUrl: "",
          status: order.status || "UNKNOWN",
        },
      });
    }
    console.log("✅ Step 10: Orders synced successfully!");
  } else {
    console.log("ℹ️ No orders found for this time range.");
  }

  return response.data;
};
/**
 * Service: Close Order (KuCoin Pay – Chapter 3.4)
 * Handles KuCoin API call and DB update.
 * Enables merchant to close an unpaid order before expiry.

 */
export const closeOrder = async (payload: { requestId: string }) => {
  const timestamp = Date.now();
  const { requestId } = payload;

  if (!requestId) throw new Error("requestId is required to close an order.");

  // 🔹 Step 1 – Prepare parameters
  const params = {
    apiKey: process.env.KUCOIN_API_KEY,
    requestId,
    timestamp,
  };
  console.log("🧩 Step 1: Params =>", params);

  // 🔹 Step 2 – Build signature string (order: apiKey, requestId, timestamp)
  const signString = `apiKey=${params.apiKey}&requestId=${params.requestId}&timestamp=${params.timestamp}`;
  console.log("🧾 Step 2: Signature String =>", signString);

  // 🔹 Step 3 – Load private key
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  console.log("🔑 Step 3: Private Key Loaded =>", privateKeyPath);

  // 🔹 Step 4 – Generate signature
  const signature = sign(signString, privateKey);
  console.log("🧠 Step 4: Signature (first 60 chars) =>", signature.slice(0, 60) + "...");

  // 🔹 Step 5 – Headers
  const headers = {
    "PAY-API-SIGN": signature,
    "PAY-API-KEY": process.env.KUCOIN_API_KEY,
    "PAY-API-VERSION": "1.0",
    "PAY-API-TIMESTAMP": timestamp.toString(),
    "Content-Type": "application/json",
  };
  console.log("📦 Step 5: Headers =>", headers);

  // 🔹 Step 6 – Body
  const body = { requestId };
  console.log("🧰 Step 6: Body =>", body);

  // 🔹 Step 7 – Call KuCoin API
  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/order/close`;
  console.log("🚀 Step 7: Calling KuCoin API =>", endpoint);

  const response = await axios.post(endpoint, body, { headers });
  console.log("✅ Step 8: KuCoin API Response =>", response.data);

  // 🔹 Step 9 – Update DB status if closed
  if (response.data?.success) {
    await prisma.order.updateMany({
      where: { requestId },
      data: { status: "CLOSED" },
    });
    console.log("💾 Step 9: Order marked as CLOSED in DB.");
  }

  return response.data;
};
export default {
  createOrder,
  queryOrder,
  queryOrderList,
  closeOrder
};
