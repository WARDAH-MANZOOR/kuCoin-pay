import crypto from "crypto";
import fs from "fs";
import path from "path";
/**
 * Generate RSA-SHA256 signature (KuCoin Pay Spec)
 * @param dataString - Sorted string like "apiKey=xxx&orderAmount=10&..."
 * @param privateKey - Merchant private key (PEM format)
 */
export function sign(dataString: string, privateKey: string): string {
  try {
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(dataString, "utf8");
    signer.end();
    const signature = signer.sign(privateKey, "base64");
    return signature.replace(/(\r\n|\n|\r)/gm, "").trim();
  } catch (err) {
    console.error("Error while signing:", err);
    throw err;
  }
}

/**
 * Verify RSA-SHA256 signature (KuCoin webhook response)
 * @param dataString - The same data string used for verification
 * @param signature - Base64 encoded signature
 * @param publicKey - KuCoin Pay public key (PEM format)
 */
export function verify(dataString: string, signature: string, publicKey: string): boolean {
  try {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(dataString, "utf8");
    verifier.end();
    return verifier.verify(publicKey, signature, "base64");
  } catch (err) {
    console.error("Error while verifying:", err);
    return false;
  }
}


export function buildSignatureString(params: Record<string, any>) {
  const order = [
    "apiKey",
    "expireTime",
    "orderAmount",
    "orderCurrency",
    "reference",
    "requestId",
    "source",
    "subMerchantId",
    "timestamp",
  ];

  return order
    .filter((key) => params[key] !== "" && params[key] !== undefined)
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}


// WEBHOOK SIGNATURE VERIFICATION FUNCTION


const KUCOIN_PUBLIC_KEY = fs.readFileSync(
  path.resolve("src/keys/kuCoin_public.pem"),
  "utf8"
);

const apiKey = process.env.KUCOIN_API_KEY!;

/*───────────────────────────────────────────
 🔍 Detect Webhook Type Automatically
────────────────────────────────────────────*/
export function detectWebhookType(body: any) {
  if (body.orderType === "TRADE") return "ORDER";
  if (body.orderType === "REFUND") return "REFUND";
  if (body.orderType === "PAYOUT") return "PAYOUT";
  if (body.orderType === "ONCHAIN_PAYMENT") return "ONCHAIN_PAYMENT";
  if (body.orderType === "ONCHAIN_REFUND") return "ONCHAIN_REFUND";

  throw new Error("Unknown webhook type");
}

/*───────────────────────────────────────────
 🧾 Build Signature Base String for Each Webhook
────────────────────────────────────────────*/
export function buildSignStringForWebhook(
  body: any,
  timestamp: string,
  type:
    | "ORDER"
    | "REFUND"
    | "PAYOUT"
    | "ONCHAIN_PAYMENT"
    | "ONCHAIN_REFUND"
) {
  const parts: string[] = [];

  const add = (k: string, v: any) => {
    if (v !== undefined && v !== null && v !== "") {
      parts.push(`${k}=${v}`);
    }
  };

  /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4.1 ORDER NOTIFICATION
   Signature Order:
   apiKey, errorReason, orderAmount, orderCurrency, payOrderId, payTime,
   reference, refundCurrency, requestId, status, subMerchantId, timestamp
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  if (type === "ORDER") {
    add("apiKey", apiKey);
    add("errorReason", body.errorReason);
    add("orderAmount", body.orderAmount);
    add("orderCurrency", body.orderCurrency);
    add("payOrderId", body.payOrderId);
    add("payTime", body.payTime);
    add("reference", body.reference);
    add("refundCurrency", body.refundCurrency);
    add("requestId", body.requestId);
    add("status", body.status);
    add("subMerchantId", body.subMerchantId);
    add("timestamp", timestamp);
  }

  /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4.2 REFUND NOTIFICATION
   Signature Order:
   apiKey, merchantId, payID, refundAmount, refundCurrency, refundFinishTime,
   refundId, remainingRefundAmount, remainingRefundCurrency, requestId,
   status, subMerchantId, timestamp
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  if (type === "REFUND") {
    add("apiKey", apiKey);
    add("merchantId", body.merchantId);
    add("payID", body.payID);
    add("refundAmount", body.refundAmount);
    add("refundCurrency", body.refundCurrency);
    add("refundFinishTime", body.refundFinishTime);
    add("refundId", body.refundId);
    add("remainingRefundAmount", body.remainingRefundAmount);
    add("remainingRefundCurrency", body.remainingRefundCurrency);
    add("requestId", body.requestId);
    add("status", body.status);
    add("subMerchantId", body.subMerchantId);
    add("timestamp", timestamp);
  }

  /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4.3 PAYOUT NOTIFICATION
   Signature Order:
   apiKey, batchNo, chain, currency, payoutType, processingFee,
   requestId, status, totalAmount, totalCount, totalPaidAmount,
   totalPayoutFee, timestamp
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  if (type === "PAYOUT") {
    add("apiKey", apiKey);
    add("batchNo", body.batchNo);
    add("chain", body.chain);
    add("currency", body.currency);
    add("payoutType", body.payoutType);
    add("processingFee", body.processingFee);
    add("requestId", body.requestId);
    add("status", body.status);
    add("totalAmount", body.totalAmount);
    add("totalCount", body.totalCount);
    add("totalPaidAmount", body.totalPaidAmount);
    add("totalPayoutFee", body.totalPayoutFee);
    add("timestamp", timestamp);
  }

  /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4.4 ONCHAIN PAYMENT NOTIFICATION
   Signature Order:
   apiKey, assetUniqueId, chain, currency,
   paymentAmount, paymentCurrency, paymentOrderType,
   paymentStatus, payOrderId, requestId, status,
   subMerchantId, timestamp
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  if (type === "ONCHAIN_PAYMENT") {
    add("apiKey", apiKey);
    add("assetUniqueId", body.assetUniqueId);
    add("chain", body.chain);
    add("currency", body.currency);
    add("paymentAmount", body.paymentAmount);
    add("paymentCurrency", body.paymentCurrency);
    add("paymentOrderType", body.paymentOrderType);
    add("paymentStatus", body.paymentStatus);
    add("payOrderId", body.payOrderId);
    add("requestId", body.requestId);
    add("status", body.status);
    add("subMerchantId", body.subMerchantId);
    add("timestamp", timestamp);
  }

  /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4.5 ONCHAIN REFUND NOTIFICATION
   Signature Order:
   apiKey, assetUniqueId, chain, feeAmount, payOrderId, refundAmount,
   refundCurrency, refundId, remainingRefundAmount, remainingRefundCurrency,
   requestId, status, subMerchantId, timestamp
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  if (type === "ONCHAIN_REFUND") {
    add("apiKey", apiKey);
    add("assetUniqueId", body.assetUniqueId);
    add("chain", body.chain);
    add("feeAmount", body.feeAmount);
    add("payOrderId", body.payOrderId);
    add("refundAmount", body.refundAmount);
    add("refundCurrency", body.refundCurrency);
    add("refundId", body.refundId);
    add("remainingRefundAmount", body.remainingRefundAmount);
    add("remainingRefundCurrency", body.remainingRefundCurrency);
    add("requestId", body.requestId);
    add("status", body.status);
    add("subMerchantId", body.subMerchantId);
    add("timestamp", timestamp);
  }

  return parts.join("&");
}

/*───────────────────────────────────────────
 🔐 Verify KuCoin Webhook Signature
────────────────────────────────────────────*/
export function verifyKucoinWebhookSignature(
  body: any,
  timestamp: string,
  signatureBase64: string
) {
  const type = detectWebhookType(body);

  const signString = buildSignStringForWebhook(body, timestamp, type);

  console.log("🧾 Final Webhook Signature String =>", signString);

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(signString, "utf8");
  verifier.end();

  return verifier.verify(KUCOIN_PUBLIC_KEY, signatureBase64, "base64");
}
