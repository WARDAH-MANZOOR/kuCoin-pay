/**
 * tools/generateWebhookSignature.ts
 * --------------------------------------
 * Local tool to generate KuCoin webhook signatures
 * EXACTLY per documentation — for all 5 webhook types.
 */



import fs from "fs";
import path from "path";
import { sign, buildSignStringForWebhook, verifyKucoinWebhookSignature } from "./src/utils/signature.js";
import dotenv from "dotenv";
dotenv.config();


// ----------------------
// Load Merchant Private Key
// ----------------------
const PRIVATE_KEY_PATH = path.resolve("src/keys/kuCoin_private.pem");
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");

// ----------------------
// Load API Key
// ----------------------
const API_KEY = process.env.KUCOIN_API_KEY;
if (!API_KEY) {
  console.error("❌ ERROR: KUCOIN_API_KEY not found in .env");
  process.exit(1);
}

// ------------------------------
// SELECT WEBHOOK TYPE TO TEST:
// ORDER / REFUND / PAYOUT / ONCHAIN_PAYMENT / ONCHAIN_REFUND
// ------------------------------
const WEBHOOK_TYPE: "ORDER" | "REFUND" | "PAYOUT" | "ONCHAIN_PAYMENT" | "ONCHAIN_REFUND" = "PAYOUT";


// ------------------------------
// EXAMPLES (you may replace these)
// ------------------------------
const SAMPLE = {
    ORDER: {
    "orderType": "TRADE",
    "requestId": "1763124196024",
    "payOrderId": "kpt_2025dummy123456",
    "status": "USER_PAY_COMPLETED",
    "orderCurrency": "USDT",
    "orderAmount": "20",
    "goods": [
      { "goodsId": "001", "goodsName": "Gift Card", "goodsDesc": "Digital" }
    ],
    "reference": "reference",
    "subMerchantId": "sub001",
    "payTime": 1740125635482,
    "canRefundAmount": "20",
    "refundCurrency": "USDT",
    "errorReason": null,
    "payerUserId": null,
    "retrieveKycStatus": null,
    "payerDetail": null
  },


  
  // ORDER: {
  //   orderType: "TRADE",
  //   requestId: "1763124196024",
  //   payOrderId: "kpt_2025dummy123456",
  //   orderAmount: "20",
  //   orderCurrency: "USDT",
  //   reference: "my-reference",
  //   refundCurrency: "USDT",
  //   status: "USER_PAY_COMPLETED",
  //   subMerchantId: "sub001",
  //   payTime: 1740125635482,
  // },
  REFUND: {
    orderType: "REFUND",

    merchantId: "6724a68720b1d20001255662",     // REQUIRED
    subMerchantId: "sub001",                    // OPTIONAL

    requestId: "req_12345",                     // Merchant refundRequestId
    refundId: "kpr_202412030703",               // KuCoin refundId
    payID: "kpt_202411290941",                  // KuCoin original payment ID

    refundAmount: "1.55",                       // string
    remainingRefundAmount: "8.45",              // string (may be null)

    status: "SUCCEEDED",                        // refund status
    refundFinishTime: 1749819910000,            // timestamp (number)

    refundCurrency: "USDT",                     // currency
    remainingRefundCurrency: "USDT",            // currency

    reference: "test-reference",                // OPTIONAL
    refundReason: "test",                       // OPTIONAL

    // Whitelisted merchant only
    payerUserId: "7306C912B109D5EAE5B0BEAE860D23EA",
    retrieveKycStatus: true,
    payerDetail: "24auuCk/Xk/ZGXxwOVqdPIm8N0zVGDXB+6Jtu...", // encrypted identity
  },

  // REFUND: {
  //   orderType: "REFUND",
  //   merchantId: "6724a68720b1d20001255662",
  //   subMerchantId: "sub001",
  //   requestId: "req_12345",
  //   refundId: "kpr_202412030703",
  //   payID: "kpt_202411290941",
  //   refundAmount: "1.55",
  //   remainingRefundAmount: "8.45",
  //   status: "SUCCEEDED",
  //   refundFinishTime: 1749819910000,
  //   refundCurrency: "USDT",
  //   remainingRefundCurrency: "USDT",
  //   refundReason: "test",
  // },

  // PAYOUT: {
  //   orderType: "PAYOUT",
  //   batchNo: "kpbw_202506250809",
  //   batchName: "Payroll Batch",
  //   currency: "USDT",
  //   payoutType: "offChain",
  //   processingFee: "0",
  //   requestId: "927c7a7b-91ee-49fd",
  //   status: "SUCCEEDED_PART",
  //   totalAmount: "500",
  //   totalCount: 3,
  //   totalPaidAmount: "250",
  //   totalPayoutFee: "0",
  // },
    PAYOUT: {
      orderType: "PAYOUT",

      batchNo: "kpbw_2025062508091949000931340045",
      batchName: "Payroll Batch",
      requestId: "927c7a7b-91ee-49fd",

      status: "SUCCEEDED_PART",       // or SUCCEEDED_FULL

      payoutType: "offChain",          // offChain OR onChain
      chain: null,                     // required only for onChain (ex: "eth")

      currency: "USDT",
      totalAmount: "500",
      totalCount: 3,

      totalPaidAmount: "250",
      processingFee: "0",
      totalPayoutFee: "0",

  withdrawDetailDtoList: [
    {
      detailId: "detailID001",
      receiverUID: "96908312131",        // offChain → UID returned
      receiverAddress: null,             // onChain → address returned
      amount: "300",
      remark: "salary-1",
      status: "SUCCEEDED",               // SUCCEEDED / FAILED / PROCESSING
      payoutFee: "0.15"
    },
    {
      detailId: "detailID002",
      receiverUID: "96908312132",
      receiverAddress: null,
      amount: "150",
      remark: "salary-2",
      status: "FAILED",
      payoutFee: null
    },
    {
      detailId: "detailID003",
      receiverUID: "96908312133",
      receiverAddress: null,
      amount: "50",
      remark: "salary-3",
      status: "PROCESSING",
      payoutFee: null
    }
  ]
},

  ONCHAIN_PAYMENT: {
    orderType: "ONCHAIN_PAYMENT",
    assetUniqueId: "tx_123",
    chain: "eth",
    currency: "USDT",
    paymentAmount: "10",
    paymentCurrency: "USDT",
    paymentOrderType: "ACTIVE",
    paymentStatus: "FULL_PAYMENT",
    requestId: "req_111",
    payOrderId: "kpo_123",
    status: "USER_PAY_COMPLETED",
    subMerchantId: "sub01",
  },

  ONCHAIN_REFUND: {
    orderType: "ONCHAIN_REFUND",
    assetUniqueId: "hash_001",
    chain: "eth",
    feeAmount: "0.12",
    payOrderId: "kpo_123",
    refundAmount: "2.97",
    refundCurrency: "USDT",
    refundId: "kpor_20250625",
    remainingRefundAmount: "7",
    remainingRefundCurrency: "USDT",
    requestId: "req_404",
    status: "SUCCEEDED",
    subMerchantId: "sub002",
    reference: "test ref",
    refundReason: "reason",
  },
};

// ------------------------------
// Pick example body
// ------------------------------
const WEBHOOK_BODY = SAMPLE[WEBHOOK_TYPE];

if (!WEBHOOK_BODY) {
  console.error("❌ ERROR: Invalid WEBHOOK_TYPE");
  process.exit(1);
}

// ------------------------------
const TIMESTAMP = Date.now().toString();

// ------------------------------
// GENERATE SIGN STRING (WE USE YOUR signature.ts LOGIC)
// ------------------------------
const signString = buildSignStringForWebhook(WEBHOOK_BODY, TIMESTAMP, WEBHOOK_TYPE);

if (!signString) {
  console.error("❌ ERROR: Sign string empty");
  process.exit(1);
}

// ------------------------------
// GENERATE RSA SIGNATURE
// ------------------------------
const signature = sign(signString, privateKey);
// 4️⃣ Local verify (sanity check)
const isValid = verifyKucoinWebhookSignature(
  WEBHOOK_BODY,   // webhook body (object)
  TIMESTAMP,      // timestamp used for signing
  signature       // generated signature
);

console.log("✔ Local Signature Verified:", isValid);


// ------------------------------
// OUTPUT
// ------------------------------
console.log("=====================================================");
console.log("🔐 KuCoin Webhook Signature Generator");
console.log("=====================================================\n");

console.log("🧾 Sign String:");
console.log(signString);
console.log("\n");

console.log("🔑 Signature (base64):");
console.log(signature);
console.log("\n----------------------------------------");
console.log("📌 Postman Headers:");
console.log("PAY-API-TIMESTAMP:", TIMESTAMP);
console.log("PAY-API-SIGN:", signature);
console.log("PAY-API-VERSION: 1.0");
console.log("----------------------------------------\n");
console.log("📌 Postman Body:");
console.log(JSON.stringify(WEBHOOK_BODY, null, 2));
console.log("\n=====================================================");
