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
// export const createOnchainRefundOrder = async (payload: {
//   requestId: string;
//   subMerchantId?: string;
//   payOrderId: string; // REQUIRED
//   refundAmount: number;
//   chain: string;
//   address: string;
//   refundReason?: string;
//   reference?: string;
// }) => {
//   const {
//     requestId,
//     subMerchantId,
//     payOrderId,
//     refundAmount,
//     chain,
//     address,
//     refundReason,
//     reference
//   } = payload;
//   const apiKey = process.env.KUCOIN_API_KEY!;
//   const timestamp = Date.now();
//   // 🚨 Validation
//   if (!requestId || !payOrderId || !refundAmount || !chain || !address) {
//     throw new Error("Missing required parameters: requestId, payOrderId, refundAmount, chain, address");
//   }
//   // ⭐ Signature string (KuCoin required order)
//   const signParts: string[] = [
//     `address=${address}`,
//     `apiKey=${apiKey}`,
//     `chain=${chain}`,
//     `payOrderId=${payOrderId}`,
//     `refundAmount=${refundAmount}`,
//     `requestId=${requestId}`,
//   ];
//   if (subMerchantId) {
//     signParts.push(`subMerchantId=${subMerchantId}`);
//   }
//   signParts.push(`timestamp=${timestamp}`);
//   const signString = signParts.join("&");
//   console.log("🧾 Signature String =>", signString);
//   // 🔐 Load Private Key
//   const privateKey = fs.readFileSync(
//     path.resolve("src/keys/merchant_private.pem"),
//     "utf8"
//   );
//   const signature = sign(signString, privateKey);
//   const headers = {
//     "PAY-API-SIGN": signature,
//     "PAY-API-KEY": apiKey,
//     "PAY-API-VERSION": "1.0",
//     "PAY-API-TIMESTAMP": timestamp.toString(),
//     "Content-Type": "application/json",
//   };
//   console.log("🛡️ Headers =>", headers);
//   // ⭐ Body must match KuCoin EXACTLY
//   const body = {
//     requestId,
//     subMerchantId,
//     payOrderId,
//     refundAmount,
//     chain,
//     address,
//     refundReason,
//     reference,
//   };
//   console.log("📦 Body =>", body);
//   const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/onchain/refund/create`;
//   console.log("🌐 POST =>", endpoint);
//   // 🔥 API CALL
//   const resp = await axios.post(endpoint, body, { headers });
//   console.log("✅ API Response =>", resp.data);
//   // ⭐ Save DB Record (Prisma model ↴)
//   const data = resp.data?.data;
//   await prisma.refund.create({
//     data: {
//       refundRequestId: requestId,
//       payID: payOrderId,                        // MUST MATCH Prisma model
//       refundAmount: refundAmount,
//       refundReason: refundReason || null,
//       subMerchantId: subMerchantId || null,
//       reference: reference || null,
//       kucoinRefundId: data?.refundId || null,
//       status: resp.data?.success ? "SUCCESS" : "FAILED",
//       chain: chain,
//       address: address,
//     },
//   });
//   return resp.data;
// };
// src/services/onchainRefund.service.ts
// interface CreateOnchainRefundPayload {
//   requestId: string;        // merchant refund requestId
//   payOrderId: string;       // KuCoin ka payOrderId (onchain order create se)
//   refundAmount: number;     // > 0
//   chain: string;            // eth / btc / etc (doc: example eth)
//   address: string;          // destination wallet address
//   subMerchantId?: string;
//   reference?: string;
//   refundReason?: string;
// }
// export const createOnchainRefundOrder = async (payload: CreateOnchainRefundPayload) => {
//   const {
//     requestId,
//     payOrderId,
//     refundAmount,
//     chain,
//     address,
//     subMerchantId,
//     reference,
//     refundReason,
//   } = payload;
//   const timestamp = Date.now();
//   const apiKey = process.env.KUCOIN_API_KEY!;
//   const baseUrl = process.env.KUCOIN_BASE_URL!;
//   if (!requestId || !payOrderId || !refundAmount || !chain || !address) {
//     throw new Error("Missing required parameters: requestId, payOrderId, refundAmount, chain, address");
//   }
//   // 🔐 Signature string (exactly doc ke mutabiq)
//   const signString = [
//     `address=${address}`,
//     `apiKey=${apiKey}`,
//     `chain=${chain}`,
//     `payOrderId=${payOrderId}`,
//     `refundAmount=${refundAmount}`,
//     `requestId=${requestId}`,
//     subMerchantId ? `subMerchantId=${subMerchantId}` : "",
//     `timestamp=${timestamp}`,
//   ]
//     .filter(Boolean)
//     .join("&");
//   console.log("🧾 Onchain Refund Signature String =>", signString);
//   const privateKey = fs.readFileSync(
//     path.resolve("src/keys/merchant_private.pem"),
//     "utf8"
//   );
//   const signature = sign(signString, privateKey);
//   const headers = {
//     "PAY-API-SIGN": signature,
//     "PAY-API-KEY": apiKey,
//     "PAY-API-VERSION": "1.0",
//     "PAY-API-TIMESTAMP": timestamp.toString(),
//     "Content-Type": "application/json",
//   };
//   console.log("🧾 Onchain Refund Headers =>", headers);
//   const body: any = {
//     requestId,
//     payOrderId,
//     refundAmount,
//     chain,
//     address,
//   };
//   if (subMerchantId) body.subMerchantId = subMerchantId;
//   if (reference) body.reference = reference;
//   if (refundReason) body.refundReason = refundReason;
//   console.log("🧰 Onchain Refund Body =>", body);
//   const endpoint = `${baseUrl}/api/v1/onchain/refund/create`;
//   const resp = await axios.post(endpoint, body, { headers });
//   console.log("✅ Onchain Refund API Response =>", resp.data);
//   const d = resp.data?.data; // { requestId, refundId }
//   // 🗄️ DB me Refund entry create karo
//   // NOTE: payID ko tum payOrderId se map kar rahe ho
//   await prisma.refund.create({
//     data: {
//       refundRequestId: requestId,
//       payID: payOrderId,
//       refundAmount,
//       refundReason: refundReason || null,
//       subMerchantId: subMerchantId || null,
//       reference: reference || null,
//       kucoinRefundId: d?.refundId || null,  // KuCoin refundId
//       chain,
//       address,
//       // status: KuCoin create ke baad bhi PENDING rahega jab tak webhook final status na de
//       status: resp.data?.success ? "PENDING" : "FAILED",
//     },
//   });
//   // service se raw KuCoin response hi return kar dete hain
//   return resp.data;
// };
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
