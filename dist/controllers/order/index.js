import axios from "axios";
import fs from "fs";
import path from "path";
import { buildSignatureString, sign } from "../../utils/signature.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
/**
 * Create Order Controller - fully dynamic version (per Chapter 3)
 */
export const createOrder = async (req, res) => {
    try {
        const timestamp = Date.now();
        // 🔹 Validate required fields from user
        const { orderAmount, orderCurrency, reference, source, subMerchantId, expireTime, goods, returnUrl, cancelUrl, } = req.body;
        if (!orderAmount || !orderCurrency || !goods || !returnUrl || !cancelUrl) {
            console.warn("⚠️ Missing required fields in request body:", req.body);
            return res.status(400).json({
                error: "Missing required fields: orderAmount, orderCurrency, goods, returnUrl, cancelUrl are mandatory.",
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
        const response = await axios.post(`${process.env.KUCOIN_BASE_URL}/api/v1/order/create`, body, { headers });
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
    }
    catch (err) {
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
export const queryOrder = async (req, res) => {
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
        console.log("🧠 Step 4: Generated signature (first 60 chars) =>", signature.slice(0, 60) + "...");
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
        const body = {};
        if (payOrderId)
            body["payOrderId"] = payOrderId;
        if (requestId)
            body["requestId"] = requestId;
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
    }
    catch (err) {
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
/**
 * Query Order List Controller - Chapter 3.3 (Enhanced)
 * Retrieves a paginated list of orders from KuCoin Pay and syncs them to local DB.
 */
export const queryOrderList = async (req, res) => {
    try {
        const timestamp = Date.now();
        const { startTime, endTime, pageNum = 1, pageSize = 10, requestIds, orderIds, status, } = req.body;
        if (!startTime || !endTime) {
            console.warn("⚠️ Missing required fields in body:", req.body);
            return res.status(400).json({
                success: false,
                error: "startTime and endTime are required parameters.",
            });
        }
        // 🔹 Step 1: Prepare parameters for signature
        const params = {
            apiKey: process.env.KUCOIN_API_KEY,
            startTime,
            endTime,
            timestamp,
        };
        console.log("🧩 Step 1: Params prepared =>", params);
        // 🔹 Step 2: Build signature string
        const signString = `apiKey=${params.apiKey}&endTime=${endTime}&startTime=${startTime}&timestamp=${timestamp}`;
        console.log("🧾 Step 2: Signature string =>", signString);
        // 🔹 Step 3: Load merchant private key
        const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
        const privateKey = fs.readFileSync(privateKeyPath, "utf8");
        console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);
        // 🔹 Step 4: Generate signature
        const signature = sign(signString, privateKey);
        console.log("🧠 Step 4: Generated signature (first 60 chars) =>", signature.slice(0, 60) + "...");
        // 🔹 Step 5: Prepare headers
        const headers = {
            "PAY-API-SIGN": signature,
            "PAY-API-KEY": process.env.KUCOIN_API_KEY,
            "PAY-API-VERSION": "1.0",
            "PAY-API-TIMESTAMP": timestamp.toString(),
            "Content-Type": "application/json",
        };
        console.log("📦 Step 5: Request headers =>", headers);
        // 🔹 Step 6: Build request body
        const body = { pageNum, pageSize, startTime, endTime };
        if (requestIds)
            body.requestIds = requestIds;
        if (orderIds)
            body.orderIds = orderIds;
        if (status)
            body.status = status;
        console.log("🧰 Step 6: Request body =>", JSON.stringify(body, null, 2));
        // 🔹 Step 7: Send API Request
        const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/order/query`;
        console.log("🚀 Step 7: Sending request to KuCoin API...");
        console.log("➡️ Endpoint:", endpoint);
        const response = await axios.post(endpoint, body, { headers });
        console.log("✅ Step 8: KuCoin API response =>", response.data);
        // 🔹 Step 9: Sync to local DB if orders found
        // const orders = response.data?.data?.list || [];
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
        }
        else {
            console.log("ℹ️ No orders found for this time range.");
        }
        // 🔹 Step 11: Return result
        res.status(200).json({
            success: true,
            message: "Order list retrieved and synced successfully",
            data: response.data,
        });
    }
    catch (err) {
        console.error("❌ Error querying order list:", err.message);
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
 * Close Order Controller - Chapter 3.4
 * Enables merchant to close an unpaid order before expiry.
 */
export const closeOrder = async (req, res) => {
    try {
        const timestamp = Date.now();
        const { requestId } = req.body;
        // 🔹 Validate required field
        if (!requestId) {
            console.warn("⚠️ Missing required field: requestId");
            return res.status(400).json({
                success: false,
                error: "requestId is required to close an order.",
            });
        }
        // 🔹 Step 1: Prepare parameters for signature
        const params = {
            apiKey: process.env.KUCOIN_API_KEY,
            requestId,
            timestamp,
        };
        console.log("🧩 Step 1: Params prepared =>", params);
        // 🔹 Step 2: Build signature string
        const signString = `apiKey=${params.apiKey}&requestId=${params.requestId}&timestamp=${params.timestamp}`;
        console.log("🧾 Step 2: Signature string =>", signString);
        // 🔹 Step 3: Load merchant private key
        const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
        const privateKey = fs.readFileSync(privateKeyPath, "utf8");
        console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);
        // 🔹 Step 4: Generate RSA-SHA256 signature
        const signature = sign(signString, privateKey);
        console.log("🧠 Step 4: Signature generated (first 60 chars) =>", signature.slice(0, 60) + "...");
        // 🔹 Step 5: Prepare headers
        const headers = {
            "PAY-API-SIGN": signature,
            "PAY-API-KEY": process.env.KUCOIN_API_KEY,
            "PAY-API-VERSION": "1.0",
            "PAY-API-TIMESTAMP": timestamp.toString(),
            "Content-Type": "application/json",
        };
        console.log("📦 Step 5: Headers =>", headers);
        // 🔹 Step 6: Build request body
        const body = { requestId };
        console.log("🧰 Step 6: Body =>", JSON.stringify(body, null, 2));
        // 🔹 Step 7: Send request to KuCoin API
        const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/order/close`;
        console.log("🚀 Step 7: Sending request to KuCoin API...");
        console.log("➡️ Endpoint:", endpoint);
        const response = await axios.post(endpoint, body, { headers });
        console.log("✅ Step 8: KuCoin API response =>", response.data);
        // 🔹 Step 9: Update DB status if applicable
        if (response.data?.success) {
            await prisma.order.updateMany({
                where: { requestId },
                data: { status: "CLOSED" },
            });
            console.log("💾 Step 9: Order marked as CLOSED in DB.");
        }
        // 🔹 Step 10: Return response
        res.status(200).json({
            success: true,
            message: "Order closed successfully",
            data: response.data,
        });
    }
    catch (err) {
        console.error("❌ Error closing order:", err.message);
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
    queryOrder,
    queryOrderList,
    closeOrder,
};
