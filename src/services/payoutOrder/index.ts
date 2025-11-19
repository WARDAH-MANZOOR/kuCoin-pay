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
// export const createPayoutOrder = async (payload: {
//   requestId: string;
//   bizScene?: string;
//   payoutType: "onChain" | "offChain";
//   batchName: string;
//   currency: string;
//   chain?: string;
//   totalAmount: number;
//   totalCount: number;
//   withdrawDetailDtoList: {
//     detailId: string;
//     receiverUID?: string;
//     receiverAddress?: string;
//     amount: number;
//     remark?: string;
//   }[];
// }) => {
//   const timestamp = Date.now();

//   const {
//     requestId,
//     bizScene,
//     payoutType,
//     batchName,
//     currency,
//     chain,
//     totalAmount,
//     totalCount,
//     withdrawDetailDtoList,
//   } = payload;

//   // 🔹 Step 1 – Validate required fields
//   if (
//     !requestId ||
//     !payoutType ||
//     !batchName ||
//     !currency ||
//     !totalAmount ||
//     !totalCount ||
//     !withdrawDetailDtoList?.length
//   ) {
//     throw new Error(
//       "Missing required parameters: requestId, payoutType, batchName, currency, totalAmount, totalCount, withdrawDetailDtoList"
//     );
//   }

//   // 🔹 Step 2 – Prepare parameters for signature
//   const params = {
//     apiKey: process.env.KUCOIN_API_KEY,
//     batchName,
//     bizScene: bizScene || "",
//     chain: chain || "",
//     currency,
//     payoutType,
//     requestId,
//     timestamp,
//     totalAmount,
//     totalCount,
//   };

//   // 🔹 Step 3 – Build signature string (exclude empty fields)
//   const signString = Object.entries(params)
//     .filter(([_, v]) => v !== "" && v !== undefined)
//     .map(([k, v]) => `${k}=${v}`)
//     .join("&");
//   console.log("🧾 Signature string =>", signString);

//   // 🔹 Step 4 – Load private key
//   const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
//   const privateKey = fs.readFileSync(privateKeyPath, "utf8");
//   console.log("🔑 Private key loaded from:", privateKeyPath);

//   // 🔹 Step 5 – Generate signature
//   const signature = sign(signString, privateKey);
//   console.log("🔐 Signature (first 60 chars):", signature.slice(0, 60) + "...");

//   // 🔹 Step 6 – Prepare headers
//   const headers = {
//     "PAY-API-SIGN": signature,
//     "PAY-API-KEY": process.env.KUCOIN_API_KEY,
//     "PAY-API-VERSION": "1.0",
//     "PAY-API-TIMESTAMP": timestamp.toString(),
//     "Content-Type": "application/json",
//   };
//   console.log("📦 Headers =>", headers);

//   // 🔹 Step 7 – Build request body
//   const body = {
//     requestId,
//     bizScene,
//     payoutType,
//     batchName,
//     currency,
//     chain,
//     totalAmount,
//     totalCount,
//     withdrawDetailDtoList,
//   };
//   console.log("🧰 Body =>", JSON.stringify(body, null, 2));

//   // 🔹 Step 8 – Send request
//   const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/withdraw/batch/create`;
//   console.log("🚀 Sending POST request =>", endpoint);

//   const response = await axios.post(endpoint, body, { headers });
//   console.log("✅ KuCoin API response =>", response.data);

//   // 🔹 Step 9 – Save payout and details in DB
//   const payoutRecord = await prisma.payout.create({
//     data: {
//       requestId,
//       batchNo: response.data?.data?.batchNo || null,
//       payoutType,
//       batchName,
//       currency,
//       chain: chain || null,
//       totalAmount,
//       totalCount,
//       status: response.data?.success ? "SUCCESS" : "FAILED",
//       details: {
//         create: withdrawDetailDtoList.map((d) => ({
//           detailId: d.detailId,
//           receiverUID: d.receiverUID || null,
//           receiverAddress: d.receiverAddress || null,
//           amount: d.amount,
//           remark: d.remark || null,
//           status: "PENDING",
//         })),
//       },
//     },
//     include: { details: true },
//   });

//   console.log("💾 Payout record + details saved to DB:", payoutRecord.id);

//   return response.data;
// };

export const createPayoutOrder = async (payload: {
  requestId: string;
  bizScene?: string; // optional
  payoutType: "onChain" | "offChain";
  batchName: string;
  currency: string;
  chain?: string; // required if payoutType = onChain
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

  // --------------------------
  // VALIDATION
  // --------------------------
  if (!requestId || !payoutType || !batchName || !currency || !totalAmount || !totalCount) {
    throw new Error("Missing required parameters for payout order.");
  }

  if (!withdrawDetailDtoList || withdrawDetailDtoList.length === 0) {
    throw new Error("withdrawDetailDtoList must contain at least 1 item.");
  }

  if (payoutType === "onChain" && !chain) {
    throw new Error("chain is required for onChain payoutType.");
  }

  // --------------------------
  // SIGNATURE FIELDS (EXACT ORDER)
  // --------------------------
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
  console.log("🔑 Signature Params:", params)
  const signString = Object.entries(params)
    .filter(([_, v]) => v !== "" && v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  console.log("🧾 Signature String:", signString);

  // --------------------------
  // LOAD PRIVATE KEY
  // --------------------------
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");

  const signature = sign(signString, privateKey);

  // --------------------------
  // HEADERS
  // --------------------------
  const headers = {
    "PAY-API-SIGN": signature,
    "PAY-API-KEY": process.env.KUCOIN_API_KEY,
    "PAY-API-VERSION": "1.0",
    "PAY-API-TIMESTAMP": timestamp.toString(),
    "Content-Type": "application/json",
  };
  console.log("📦 Headers:", headers);
  // --------------------------
  // REQUEST BODY
  // --------------------------
  const body = {
    requestId,
    bizScene,
    payoutType,
    batchName,
    currency,
    chain: payoutType === "onChain" ? chain : undefined,
    totalAmount,
    totalCount,
    withdrawDetailDtoList,
  };

  console.log("📦 Payload Body:", JSON.stringify(body, null, 2));

  // --------------------------
  // API CALL
  // --------------------------
  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/withdraw/batch/create`;
  console.log("🚀 POST =>", endpoint);

  const response = await axios.post(endpoint, body, { headers });

  console.log("KuCoin API Response:", response.data);

  // --------------------------
  // SAVE TO DATABASE
  // --------------------------
  const payoutRecord = await prisma.payout.create({
    data: {
      requestId,
      bizScene: bizScene || null,
      batchNo: response.data?.data?.batchNo || null,
      batchName,
      payoutType,
      currency,
      chain: payoutType === "onChain" ? chain : null,
      totalAmount,
      totalCount,
      status: response.data?.success ? "PROCESSING" : "FAILED",

      details: {
        create: withdrawDetailDtoList.map((d) => ({
          detailId: d.detailId,
          receiverUID: d.receiverUID ?? null,
          receiverAddress: d.receiverAddress ?? null,
          amount: d.amount,
          remark: d.remark ?? null,
          status: "PENDING",
        })),
      },
    },
    include: { details: true },
  });

  console.log("💾 Saved payout record:", payoutRecord.id);

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
  console.log("🧾 Signature Params =>", params);
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
  console.log("📦 Headers =>", headers);
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
  console.log("🧾 Signature Params =>", params);
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
  console.log("📦 Headers =>", headers);
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

/**
 * Service: Query On-Chain Currency API (Chapter 3.12)
 * Retrieve supported networks for the specific crypto currency 
 * Endpoint: /api/v1/onchain/currency/query
 * Signature: apiKey, timestamp
 */
export const queryOnchainCurrency = async (payload: { cryptoCurrency: string }) => {
  const timestamp = Date.now();
  const { cryptoCurrency } = payload;

  if (!cryptoCurrency) {
    throw new Error("Missing required parameter: cryptoCurrency");
  }

  // Step 1 – Prepare parameters for signature
  const params = {
    apiKey: process.env.KUCOIN_API_KEY,
    cryptoCurrency,
    timestamp,
  };
  console.log("🔑 Signature Params:", params);

  // Step 2 – Build signature string
  const signString = `apiKey=${params.apiKey}&cryptoCurrency=${cryptoCurrency}&timestamp=${timestamp}`;
  console.log("🧾 Signature String =>", signString);

  // Step 3 – Load private key
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");

  // Step 4 – Generate signature
  const signature = sign(signString, privateKey);
  console.log("🔐 Signature (first 60 chars):", signature.slice(0, 60) + "...");

  // Step 5 – Prepare headers
  const headers = {
    "PAY-API-SIGN": signature,
    "PAY-API-KEY": process.env.KUCOIN_API_KEY!,
    "PAY-API-VERSION": "1.0",
    "PAY-API-TIMESTAMP": timestamp.toString(),
    "Content-Type": "application/json",
  };
  console.log("📦 Headers =>", headers);

  // Step 6 – Request body
  const body = { cryptoCurrency };
  console.log("🧰 Body =>", body);

  // Step 7 – Send request
  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/onchain/currency/query`;
  console.log("🚀 POST =>", endpoint);

  const response = await axios.post(endpoint, body, { headers });
  console.log("✅ API Response =>", response.data);

  return response.data;
};

/**
 * 3.13 ONCHAIN CURRENCY QUOTE API
 * URL: /api/v1/onchain/payment/quote
 * Signature fields (in EXACT order):
 *  apiKey, chain, cryptoCurrency, fiatAmount, fiatCurrency, timestamp
 * Retrieve currency exchange rate 
 */
export const queryOnchainCurrencyQuote = async (payload: {
  fiatCurrency: string;   // e.g. "EUR"
  fiatAmount: number;     // e.g. 100
  cryptoCurrency: string; // e.g. "USDT"
  chain: string;          // e.g. "eth"
}) => {
  const { fiatCurrency, fiatAmount, cryptoCurrency, chain } = payload;
  const timestamp = Date.now();

  if (!fiatCurrency || fiatAmount == null || !cryptoCurrency || !chain) {
    throw new Error("Missing required parameters: fiatCurrency, fiatAmount, cryptoCurrency, chain");
  }

  // ✅ Build exact signature string as per docs (no spaces!)
  const apiKey = process.env.KUCOIN_API_KEY as string;
  const signString = `apiKey=${apiKey}&chain=${chain}&cryptoCurrency=${cryptoCurrency}&fiatAmount=${String(fiatAmount).trim()}&fiatCurrency=${fiatCurrency}&timestamp=${timestamp}`;
  console.log("🧾 Signature String =>", signString);

  // 🔐 Sign with private key (RSA-SHA256 → Base64)
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  const signature = sign(signString, privateKey);
  console.log("🔐 Signature (first 60):", signature.slice(0, 60) + "...");

  const headers = {
    "PAY-API-SIGN": signature,
    "PAY-API-KEY": apiKey,
    "PAY-API-VERSION": "1.0",
    "PAY-API-TIMESTAMP": timestamp.toString(),
    "Content-Type": "application/json",
  };
  console.log("📦 Headers =>", headers);
  const body = {
    fiatCurrency,
    fiatAmount,
    cryptoCurrency,
    chain,
  };
  console.log("🧰 Body =>", body);

  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/onchain/payment/quote`;
  console.log("🚀 POST =>", endpoint);

  const resp = await axios.post(endpoint, body, { headers });
  console.log("✅ API Response =>", resp.data);

  return resp.data;
};

export default {
  createPayoutOrder,
  queryPayoutInfo,
  queryPayoutDetail,
  queryOnchainCurrency,
  queryOnchainCurrencyQuote
};
