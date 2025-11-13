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
export const createOnchainRefundOrder = async (payload: {
  requestId: string;
  subMerchantId?: string;
  payOrderId: string;
  refundAmount: number;
  chain: string;
  address: string;
  refundReason?: string;
  reference?: string;
}) => {
  const { requestId, subMerchantId, payOrderId, refundAmount, chain, address, refundReason, reference } = payload;
  const apiKey = process.env.KUCOIN_API_KEY!;
  const timestamp = Date.now();

  if (!requestId || !payOrderId || !refundAmount || !chain || !address) {
    throw new Error("Missing required parameters: requestId, payOrderId, refundAmount, chain, address");
  }

  // ✅ Signature string per doc (must follow this exact order)
  const signParts: string[] = [
    `address=${address}`,
    `apiKey=${apiKey}`,
    `chain=${chain}`,
    `payOrderId=${payOrderId}`,
    `refundAmount=${refundAmount}`,
    `requestId=${requestId}`,
  ];
  if (subMerchantId) signParts.push(`subMerchantId=${subMerchantId}`);
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

  const body = { requestId, subMerchantId, payOrderId, refundAmount, chain, address, refundReason, reference };
  console.log("📦 Body =>", body);

  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/onchain/refund/create`;
  console.log("🌐 POST =>", endpoint);

  const resp = await axios.post(endpoint, body, { headers });
  console.log("✅ API Response =>", resp.data);

  // ✅ Save refund record to DB
  const data = resp.data?.data;
  await prisma.refund.create({
    data: {
      refundRequestId: requestId,
      payOrderId,
      refundAmount,
      refundReason: refundReason || null,
      kucoinRefundId: data?.refundId || null,
      status: resp.data?.success ? "SUCCESS" : "FAILED",
    },
  });

  return resp.data;
};
export const queryOnchainRefundOrder = async (payload: {
  refundId?: string;
  requestId?: string;
}) => {
  const { refundId, requestId } = payload;

  if (!refundId && !requestId) {
    throw new Error("Either refundId or requestId must be provided");
  }

  const apiKey = process.env.KUCOIN_API_KEY!;
  const timestamp = Date.now();

  // ✅ Signature order EXACT per documentation
  const signParts: string[] = [`apiKey=${apiKey}`];

  if (refundId) signParts.push(`refundId=${refundId}`);
  if (requestId) signParts.push(`requestId=${requestId}`);

  signParts.push(`timestamp=${timestamp}`);

  const signString = signParts.join("&");
  console.log("🧾 Signature String =>", signString);

  const privateKey = fs.readFileSync(
    path.resolve("src/keys/merchant_private.pem"),
    "utf8"
  );
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
export default { createOnchainRefundOrder, queryOnchainRefundOrder };
