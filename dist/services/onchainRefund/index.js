// src/services/onchainRefundService.ts
import axios from "axios";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { sign } from "../../utils/signature.js";
const prisma = new PrismaClient();
/**
 * Service: Create Onchain Refund Order (Chapter 3.17)
 * Endpoint: /api/v1/onchain/refund/create
 */
export const createOnchainRefundOrder = async (payload) => {
    const clean = (v) => v
        .replace(/(\r\n|\n|\r)/gm, "")
        .replace(/[\u2028\u2029]/g, "")
        .replace(/[\u200B\u200C\u200D]/g, "")
        .replace(/\s+/g, "");
    let { requestId, subMerchantId, payOrderId, refundAmount, chain, address, refundReason, reference } = payload;
    const apiKey = clean(process.env.KUCOIN_API_KEY);
    requestId = clean(requestId);
    payOrderId = clean(payOrderId);
    address = clean(address);
    const timestamp = Date.now();
    const signString = `address=${address}` +
        `&apiKey=${apiKey}` +
        `&chain=${chain}` +
        `&payOrderId=${payOrderId}` +
        `&refundAmount=${refundAmount}` +
        `&requestId=${requestId}` +
        (subMerchantId ? `&subMerchantId=${clean(subMerchantId)}` : "") +
        `&timestamp=${timestamp}`;
    const finalSignString = clean(signString);
    console.log("SIGN STRING:", finalSignString);
    const privateKey = fs.readFileSync(path.resolve("src/keys/merchant_private.pem"), "utf8");
    const signature = sign(finalSignString, privateKey);
    const headers = {
        "PAY-API-SIGN": signature,
        "PAY-API-KEY": apiKey,
        "PAY-API-VERSION": "1.0",
        "PAY-API-TIMESTAMP": timestamp.toString(),
        "Content-Type": "application/json",
    };
    console.log("HEADERS:", headers);
    const body = {
        requestId,
        subMerchantId,
        payOrderId,
        refundAmount,
        chain,
        address,
        refundReason,
        reference,
    };
    console.log("BODY:", body);
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/onchain/refund/create`;
    const resp = await axios.post(endpoint, body, { headers });
    // Save in DB correctly
    await prisma.refund.create({
        data: {
            refundRequestId: requestId,
            payOrderId, // <-- correct field
            refundAmount,
            refundReason,
            subMerchantId,
            reference,
            kucoinRefundId: resp.data?.data?.refundId || null,
            chain,
            address,
            status: resp.data?.success ? "SUCCESS" : "FAILED",
        },
    });
    return resp.data;
};
export const queryOnchainRefundOrder = async (payload) => {
    const { refundId, requestId } = payload;
    if (!refundId && !requestId) {
        throw new Error("Either refundId or requestId must be provided");
    }
    const apiKey = process.env.KUCOIN_API_KEY;
    const timestamp = Date.now();
    // ✅ Signature order EXACT per documentation
    const signParts = [`apiKey=${apiKey}`];
    if (refundId)
        signParts.push(`refundId=${refundId}`);
    if (requestId)
        signParts.push(`requestId=${requestId}`);
    signParts.push(`timestamp=${timestamp}`);
    const signString = signParts.join("&");
    console.log("🧾 Signature String =>", signString);
    const privateKey = fs.readFileSync(path.resolve("src/keys/merchant_private.pem"), "utf8");
    const signature = sign(signString, privateKey);
    const headers = {
        "PAY-API-SIGN": signature,
        "PAY-API-KEY": apiKey,
        "PAY-API-VERSION": "1.0",
        "PAY-API-TIMESTAMP": timestamp.toString(),
        "Content-Type": "application/json",
    };
    console.log("🛡️ Headers =>", headers);
    const body = { refundId, requestId };
    console.log("📦 Body =>", body);
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/onchain/refund/info`;
    console.log("🌐 POST =>", endpoint);
    const resp = await axios.post(endpoint, body, { headers });
    console.log("✅ API Response =>", resp.data);
    // Optional DB sync
    if (resp.data?.data) {
        const r = resp.data.data;
        await prisma.refund.updateMany({
            where: {
                OR: [
                    { kucoinRefundId: r.refundId },
                    { refundRequestId: r.requestId }
                ],
            },
            data: {
                status: r.status || "UNKNOWN",
                refundAmount: parseFloat(r.refundAmount || 0),
                refundReason: r.refundReason || null,
                updatedAt: new Date(),
            },
        });
    }
    return resp.data;
};
export const queryOnchainRefundOrderList = async (payload) => {
    const { pageNum = 1, pageSize = 10, startTime, endTime } = payload;
    if (!startTime || !endTime) {
        throw new Error("startTime and endTime are required");
    }
    const apiKey = process.env.KUCOIN_API_KEY;
    const timestamp = Date.now();
    // ✅ EXACT signature order per documentation
    const signString = `apiKey=${apiKey}&endTime=${endTime}&startTime=${startTime}&timestamp=${timestamp}`;
    console.log("🧾 Signature String =>", signString);
    const privateKey = fs.readFileSync(path.resolve("src/keys/merchant_private.pem"), "utf8");
    const signature = sign(signString, privateKey);
    const headers = {
        "PAY-API-SIGN": signature,
        "PAY-API-KEY": apiKey,
        "PAY-API-VERSION": "1.0",
        "PAY-API-TIMESTAMP": timestamp.toString(),
        "Content-Type": "application/json",
    };
    console.log("🛡️ Headers =>", headers);
    const body = {
        pageNum,
        pageSize,
        startTime,
        endTime,
    };
    console.log("📦 Body =>", body);
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/refund/query`;
    console.log("🌐 POST =>", endpoint);
    const resp = await axios.post(endpoint, body, { headers });
    console.log("✅ API Response =>", resp.data);
    return resp.data;
};
export default { createOnchainRefundOrder, queryOnchainRefundOrder, queryOnchainRefundOrderList };
