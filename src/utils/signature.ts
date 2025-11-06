import crypto from "crypto";

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
