import axios from "axios";
import fs from "fs";
import path from "path";
import { sign } from "../../utils/signature.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
/**
 * Service: Refund Order (KuCoin Pay – Chapter 3.5)
 * Handles refund request, KuCoin API call, and database update.
 * Initiates a refund (full or partial) for a KuCoin Pay order.
 */
export const refundOrder = async (payload) => {
    const timestamp = Date.now();
    const { payID, refundAmount, refundReason, requestId, subMerchantId, reference } = payload;
    if (!payID || !refundAmount || !requestId) {
        throw new Error("payID, refundAmount, and requestId are required.");
    }
    // 🔹 Step 1: Prepare parameters
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
    // 🔹 Step 2: Build signature string (non-empty fields only)
    const signString = Object.entries(params)
        .filter(([_, v]) => v !== "" && v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
    console.log("🧾 Step 2: Signature string =>", signString);
    // 🔹 Step 3: Load merchant private key
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
    // 🔹 Step 7: Call KuCoin API
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/refund/create`;
    console.log("🚀 Step 7: Sending request to KuCoin API...");
    console.log("➡️ Endpoint:", endpoint);
    const response = await axios.post(endpoint, body, { headers });
    console.log("✅ Step 8: KuCoin API response =>", response.data);
    // 🔹 Step 9: Save refund record
    await prisma.refund.create({
        data: {
            refundRequestId: requestId,
            payOrderId: payID,
            refundAmount: parseFloat(String(refundAmount)),
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
    return response.data;
};
/**
 * Service: Query Refund (KuCoin Pay – Chapter 3.6)
 * Fetches refund details from KuCoin and updates DB.
 * Allows merchants to query the status and details of a refund.
 * This API lets you check refund status using either:
    refundId (from KuCoin Pay’s response to refund/create), or
    requestId (the merchant’s own refund request ID).
 */
export const queryRefund = async (payload) => {
    const timestamp = Date.now();
    const { refundId, requestId } = payload;
    if (!refundId && !requestId) {
        throw new Error("Either refundId or requestId is required.");
    }
    // 🔹 Step 1 – Prepare parameters (for signature)
    const params = {
        apiKey: process.env.KUCOIN_API_KEY,
        refundId: refundId || "",
        requestId: requestId || "",
        timestamp,
    };
    console.log("🧩 Step 1: Params prepared =>", params);
    // 🔹 Step 2 – Build signature string (ignore empty fields)
    const signString = Object.entries(params)
        .filter(([_, v]) => v !== "" && v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
    console.log("🧾 Step 2: Signature string =>", signString);
    // 🔹 Step 3 – Load merchant private key
    const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);
    // 🔹 Step 4 – Generate signature
    const signature = sign(signString, privateKey);
    console.log("🧠 Step 4: Signature (first 60 chars):", signature.slice(0, 60) + "...");
    // 🔹 Step 5 – Headers
    const headers = {
        "PAY-API-SIGN": signature,
        "PAY-API-KEY": process.env.KUCOIN_API_KEY,
        "PAY-API-VERSION": "1.0",
        "PAY-API-TIMESTAMP": timestamp.toString(),
        "Content-Type": "application/json",
    };
    console.log("📦 Step 5: Headers =>", headers);
    // 🔹 Step 6 – Request body
    const body = refundId ? { refundId } : { requestId };
    console.log("🧰 Step 6: Body =>", JSON.stringify(body, null, 2));
    // 🔹 Step 7 – API Call
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/refund/info`;
    console.log("🚀 Step 7: Sending request to KuCoin API...");
    console.log("➡️ Endpoint:", endpoint);
    const response = await axios.post(endpoint, body, { headers });
    console.log("✅ Step 8: KuCoin API response =>", response.data);
    // 🔹 Step 9 – Upsert refund record in DB
    if (response.data?.data) {
        const r = response.data.data;
        await prisma.refund.upsert({
            where: { refundRequestId: r.requestId },
            update: {
                status: r.status || "UNKNOWN",
                kucoinRefundId: r.refundId || null,
                refundAmount: parseFloat(r.refundAmount || "0"),
                refundReason: r.refundReason || null,
            },
            create: {
                refundRequestId: r.requestId,
                payOrderId: r.payID || "",
                refundAmount: parseFloat(r.refundAmount || "0"),
                refundReason: r.refundReason || "N/A",
                kucoinRefundId: r.refundId || null,
                status: r.status || "PENDING",
            },
        });
        console.log("💾 Step 9: Refund record synced to DB.");
    }
    else {
        console.log("ℹ️ No refund data returned from API.");
    }
    return response.data;
};
/**
 * Service: Query Refund Order List (KuCoin Pay – Chapter 3.7)
 * Retrieves refund orders for a given time range and syncs them into DB.
 */
export const queryRefundList = async (payload) => {
    const timestamp = Date.now();
    const { startTime, endTime, pageNum = 1, pageSize = 10, requestIds, refundIds, status, } = payload;
    if (!startTime || !endTime) {
        throw new Error("startTime and endTime are required.");
    }
    // 🔹 Step 1 – Prepare parameters for signature
    const params = {
        apiKey: process.env.KUCOIN_API_KEY,
        startTime,
        endTime,
        timestamp,
    };
    console.log("🧩 Step 1: Params prepared =>", params);
    // 🔹 Step 2 – Build signature string (apiKey,endTime,startTime,timestamp)
    const signString = `apiKey=${params.apiKey}&endTime=${endTime}&startTime=${startTime}&timestamp=${timestamp}`;
    console.log("🧾 Step 2: Signature string =>", signString);
    // 🔹 Step 3 – Load merchant private key
    const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);
    // 🔹 Step 4 – Generate signature
    const signature = sign(signString, privateKey);
    console.log("🧠 Step 4: Signature (first 60 chars):", signature.slice(0, 60) + "...");
    // 🔹 Step 5 – Headers
    const headers = {
        "PAY-API-SIGN": signature,
        "PAY-API-KEY": process.env.KUCOIN_API_KEY,
        "PAY-API-VERSION": "1.0",
        "PAY-API-TIMESTAMP": timestamp.toString(),
        "Content-Type": "application/json",
    };
    console.log("📦 Step 5: Headers =>", headers);
    // 🔹 Step 6 – Request body
    const body = { pageNum, pageSize, startTime, endTime };
    if (requestIds)
        body.requestIds = requestIds;
    if (refundIds)
        body.refundIds = refundIds;
    if (status)
        body.status = status;
    console.log("🧰 Step 6: Body =>", JSON.stringify(body, null, 2));
    // 🔹 Step 7 – API Call
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/refund/query`;
    console.log("🚀 Step 7: Sending request to KuCoin API...");
    console.log("➡️ Endpoint:", endpoint);
    const response = await axios.post(endpoint, body, { headers });
    console.log("✅ Step 8: KuCoin API response =>", response.data);
    // 🔹 Step 9 – Sync refunds to DB
    const refunds = response.data?.data?.items || [];
    if (refunds.length > 0) {
        console.log(`💾 Step 9: Syncing ${refunds.length} refunds to DB...`);
        for (const refund of refunds) {
            await prisma.refund.upsert({
                where: { refundRequestId: refund.requestId },
                update: {
                    status: refund.status || "UNKNOWN",
                    kucoinRefundId: refund.refundId || null,
                    refundAmount: parseFloat(refund.refundAmount || "0"),
                    refundReason: refund.refundReason || null,
                },
                create: {
                    refundRequestId: refund.requestId,
                    payOrderId: refund.payID || "",
                    refundAmount: parseFloat(refund.refundAmount || "0"),
                    refundReason: refund.refundReason || "N/A",
                    kucoinRefundId: refund.refundId || null,
                    status: refund.status || "PENDING",
                },
            });
        }
        console.log("✅ Step 10: Refund list synced successfully.");
    }
    else {
        console.log("ℹ️ No refunds found for this time range.");
    }
    return response.data;
};
export default {
    refundOrder,
    queryRefund,
    queryRefundList
};
