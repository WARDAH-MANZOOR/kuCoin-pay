import axios from "axios";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { sign } from "../../utils/signature.js";
const prisma = new PrismaClient();
/**
 * Service: Create Payout Order (KuCoin Pay API v3.9 - Chapter 3.9)
 * Endpoint: /api/v1/withdraw/batch/create
 * Handles signature, API request, and DB persistence.
 */
export const createPayoutOrder = async (payload) => {
    const timestamp = Date.now();
    const { requestId, bizScene, payoutType, batchName, currency, chain, totalAmount, totalCount, withdrawDetailDtoList, } = payload;
    // 🔹 Step 1 – Validate required fields
    if (!requestId ||
        !payoutType ||
        !batchName ||
        !currency ||
        !totalAmount ||
        !totalCount ||
        !withdrawDetailDtoList?.length) {
        throw new Error("Missing required parameters: requestId, payoutType, batchName, currency, totalAmount, totalCount, withdrawDetailDtoList");
    }
    // 🔹 Step 2 – Prepare parameters for signature
    const params = {
        apiKey: process.env.KUCOIN_API_KEY,
        batchName,
        bizScene: bizScene || "",
        chain: chain || "",
        currency,
        payoutType,
        requestId,
        timestamp,
        totalAmount,
        totalCount,
    };
    // 🔹 Step 3 – Build signature string (exclude empty fields)
    const signString = Object.entries(params)
        .filter(([_, v]) => v !== "" && v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
    console.log("🧾 Signature string =>", signString);
    // 🔹 Step 4 – Load private key
    const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    console.log("🔑 Private key loaded from:", privateKeyPath);
    // 🔹 Step 5 – Generate signature
    const signature = sign(signString, privateKey);
    console.log("🔐 Signature (first 60 chars):", signature.slice(0, 60) + "...");
    // 🔹 Step 6 – Prepare headers
    const headers = {
        "PAY-API-SIGN": signature,
        "PAY-API-KEY": process.env.KUCOIN_API_KEY,
        "PAY-API-VERSION": "1.0",
        "PAY-API-TIMESTAMP": timestamp.toString(),
        "Content-Type": "application/json",
    };
    console.log("📦 Headers =>", headers);
    // 🔹 Step 7 – Build request body
    const body = {
        requestId,
        bizScene,
        payoutType,
        batchName,
        currency,
        chain,
        totalAmount,
        totalCount,
        withdrawDetailDtoList,
    };
    console.log("🧰 Body =>", JSON.stringify(body, null, 2));
    // 🔹 Step 8 – Send request
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/withdraw/batch/create`;
    console.log("🚀 Sending POST request =>", endpoint);
    const response = await axios.post(endpoint, body, { headers });
    console.log("✅ KuCoin API response =>", response.data);
    // 🔹 Step 9 – Save payout and details in DB
    const payoutRecord = await prisma.payout.create({
        data: {
            requestId,
            batchNo: response.data?.data?.batchNo || null,
            payoutType,
            batchName,
            currency,
            chain: chain || null,
            totalAmount,
            totalCount,
            status: response.data?.success ? "SUCCESS" : "FAILED",
            details: {
                create: withdrawDetailDtoList.map((d) => ({
                    detailId: d.detailId,
                    receiverUID: d.receiverUID || null,
                    receiverAddress: d.receiverAddress || null,
                    amount: d.amount,
                    remark: d.remark || null,
                    status: "PENDING",
                })),
            },
        },
        include: { details: true },
    });
    console.log("💾 Payout record + details saved to DB:", payoutRecord.id);
    return response.data;
};
export default {
    createPayoutOrder,
};
