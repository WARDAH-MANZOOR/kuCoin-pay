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
export const createPayoutOrder = async (payload: {
  requestId: string;
  bizScene?: string;
  payoutType: "onChain" | "offChain";
  batchName: string;
  currency: string;
  chain?: string;
  totalAmount: number;
  totalCount: number;
  withdrawDetailDtoList: {
    detailId: string;
    receiverUID?: string;
    receiverAddress?: string;
    amount: number;
    remark?: string;
  }[];
}) => {
  const timestamp = Date.now();

  const {
    requestId,
    bizScene,
    payoutType,
    batchName,
    currency,
    chain,
    totalAmount,
    totalCount,
    withdrawDetailDtoList,
  } = payload;

  // 🔹 Step 1 – Validate required fields
  if (
    !requestId ||
    !payoutType ||
    !batchName ||
    !currency ||
    !totalAmount ||
    !totalCount ||
    !withdrawDetailDtoList?.length
  ) {
    throw new Error(
      "Missing required parameters: requestId, payoutType, batchName, currency, totalAmount, totalCount, withdrawDetailDtoList"
    );
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
/**
 * Service: Query Payout Info (Chapter 3.10)
 * Endpoint : /api/v1/withdraw/batch/info
 * Signature : apiKey,batchNo,requestId,timestamp
 */
export const queryPayoutInfo = async (payload: {
  batchNo?: string;
  requestId?: string;
}) => {
  const timestamp = Date.now();
  const { batchNo, requestId } = payload;

  // 🔹 Validate required fields
  if (!batchNo && !requestId)
    throw new Error("Either batchNo or requestId is required.");

  // 🔹 Step 1 – Prepare signature params
  const params = {
    apiKey: process.env.KUCOIN_API_KEY,
    batchNo: batchNo || "",
    requestId: requestId || "",
    timestamp,
  };

  // 🔹 Step 2 – Build signature string (exclude empty)
  const signString = Object.entries(params)
    .filter(([_, v]) => v !== "" && v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  console.log("🧾 Signature String =>", signString);

  // 🔹 Step 3 – Load private key & sign
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  const signature = sign(signString, privateKey);
  console.log("🔐 Signature (first 60) =>", signature.slice(0, 60) + "...");

  // 🔹 Step 4 – Headers
  const headers = {
    "PAY-API-SIGN": signature,
    "PAY-API-KEY": process.env.KUCOIN_API_KEY,
    "PAY-API-VERSION": "1.0",
    "PAY-API-TIMESTAMP": timestamp.toString(),
    "Content-Type": "application/json",
  };

  // 🔹 Step 5 – Body
  const body = batchNo ? { batchNo } : { requestId };
  console.log("🧰 Body =>", body);

  // 🔹 Step 6 – Call KuCoin API
  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/withdraw/batch/info`;
  console.log("🚀 POST =>", endpoint);
  const response = await axios.post(endpoint, body, { headers });
  console.log("✅ API Response =>", response.data);

  // 🔹 Step 7 – Update DB record if exists
  if (response.data?.data) {
    const data = response.data.data;
    await prisma.payout.updateMany({
      where: {
        OR: [{ batchNo: data.batchNo || null }, { requestId: data.requestId }],
      },
      data: {
        status: data.status || "UNKNOWN",
        batchNo: data.batchNo || null,
        updatedAt: new Date(),
      },
    });
    console.log("💾 DB updated with latest payout status.");
  }

  return response.data;
};

/**
 * Service: Query Payout Detail (KuCoin Pay API v3.9 – Chapter 3.11)
 * Endpoint: /api/v1/withdraw/batch/detail
 * Signature: apiKey,receiverAddress,receiverUID,requestId,timestamp
 */
export const queryPayoutDetail = async (payload: {
  requestId: string;
  receiverUID?: string;
  receiverAddress?: string;
}) => {
  const timestamp = Date.now();
  const { requestId, receiverUID, receiverAddress } = payload;

  // 🔹 Validation
  if (!requestId)
    throw new Error("Missing required parameter: requestId");
  if (!receiverUID && !receiverAddress)
    throw new Error("Either receiverUID or receiverAddress must be provided");

  // 🔹 Step 1 – Prepare signature params
  const params = {
    apiKey: process.env.KUCOIN_API_KEY,
    receiverAddress: receiverAddress || "",
    receiverUID: receiverUID || "",
    requestId,
    timestamp,
  };

  // 🔹 Step 2 – Build signature string
  const signString = Object.entries(params)
    .filter(([_, v]) => v !== "" && v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  console.log("🧾 Signature String =>", signString);

  // 🔹 Step 3 – Load private key & sign
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  const signature = sign(signString, privateKey);
  console.log("🔐 Signature (first 60) =>", signature.slice(0, 60) + "...");

  // 🔹 Step 4 – Headers
  const headers = {
    "PAY-API-SIGN": signature,
    "PAY-API-KEY": process.env.KUCOIN_API_KEY,
    "PAY-API-VERSION": "1.0",
    "PAY-API-TIMESTAMP": timestamp.toString(),
    "Content-Type": "application/json",
  };

  // 🔹 Step 5 – Body
  const body = receiverUID
    ? { requestId, receiverUID }
    : { requestId, receiverAddress };
  console.log("🧰 Body =>", body);

  // 🔹 Step 6 – Send request
  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/withdraw/batch/detail`;
  console.log("🚀 POST =>", endpoint);

  const response = await axios.post(endpoint, body, { headers });
  console.log("✅ API Response =>", response.data);

  // 🔹 Step 7 – Update DB detail status if exists
  if (response.data?.data?.length) {
    for (const d of response.data.data) {
      await prisma.payoutDetail.updateMany({
        where: {
          OR: [
            { receiverAddress: d.receiverAddress || null },
            { receiverUID: d.receiverUID || null },
            { detailId: d.detailId || null },
          ],
        },
        data: {
          status: d.status || "UNKNOWN",
          updatedAt: new Date(),
        },
      });
    }
    console.log("💾 Payout detail statuses updated in DB.");
  }

  return response.data;
};
export default {
  createPayoutOrder,
  queryPayoutInfo,
  queryPayoutDetail
};
