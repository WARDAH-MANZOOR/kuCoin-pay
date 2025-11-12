import axios from "axios";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { sign } from "../../utils/signature.js";
const prisma = new PrismaClient();
/**
 * Service: Create On-Chain Order (Chapter 3.14)
 * Endpoint: /api/v1/onchain/payment/order/create
 */
export const createOnchainOrder = async (payload) => {
    const { requestId, subMerchantId, fiatCurrency, fiatAmount, cryptoCurrency, cryptoAmount, chain, reference, goods } = payload;
    const timestamp = Date.now();
    const apiKey = process.env.KUCOIN_API_KEY;
    if (!requestId || !cryptoCurrency || !cryptoAmount || !chain || !goods?.length)
        throw new Error("Missing required parameters: requestId, cryptoCurrency, cryptoAmount, chain, goods");
    // ✅ Signature per doc
    const signString = `apiKey=${apiKey}` +
        `&chain=${chain}` +
        `&cryptoAmount=${cryptoAmount}` +
        `&cryptoCurrency=${cryptoCurrency}` +
        `&fiatAmount=${fiatAmount}` +
        `&fiatCurrency=${fiatCurrency}` +
        `&requestId=${requestId}` +
        (subMerchantId ? `&subMerchantId=${subMerchantId}` : "") +
        `&timestamp=${timestamp}`;
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
    console.log("🧾 Headers =>", headers);
    const body = { requestId, subMerchantId, fiatCurrency, fiatAmount, cryptoCurrency, cryptoAmount, chain, reference, goods };
    console.log("🧰 Body =>", body);
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/onchain/payment/create`;
    const resp = await axios.post(endpoint, body, { headers });
    console.log("✅ API Response =>", resp.data);
    const d = resp.data?.data;
    await prisma.onchainOrder.create({
        data: {
            requestId,
            subMerchantId: subMerchantId || null,
            fiatCurrency,
            fiatAmount,
            cryptoCurrency,
            cryptoAmount,
            chain,
            reference: reference || null,
            kucoinOrderId: d?.payOrderId || null,
            walletAddress: d?.address || null,
            precision: d?.precision || null,
            expireTime: d?.expireTime || null,
            status: resp.data?.success ? "CREATED" : "FAILED",
        },
    });
    return resp.data;
}; /**
 * Service: Query On-Chain Order (Chapter 3.15)
Retrieve onchain payment info
 * Endpoint: /api/v1/onchain/payment/info
 */
export const queryOnchainOrder = async (payload) => {
    const { requestId, payOrderId } = payload;
    if (!requestId && !payOrderId)
        throw new Error("Either requestId or payOrderId must be provided");
    const apiKey = process.env.KUCOIN_API_KEY;
    const timestamp = Date.now();
    // ✅ Build signature string dynamically — only include non-empty fields
    let signParts = [`apiKey=${apiKey}`];
    if (payOrderId)
        signParts.push(`payOrderId=${payOrderId}`);
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
    console.log("🧾 Headers =>", headers);
    const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/onchain/payment/info`;
    const body = {};
    if (requestId)
        body.requestId = requestId;
    if (payOrderId)
        body.payOrderId = payOrderId;
    console.log("📦 Body =>", body);
    console.log("🌐 POST =>", endpoint);
    const resp = await axios.post(endpoint, body, { headers });
    console.log("✅ API Response =>", resp.data);
    const d = resp.data?.data;
    // ✅ Update local DB if data exists
    if (d) {
        await prisma.onchainOrder.updateMany({
            where: {
                OR: [
                    { requestId: d.requestId },
                    { kucoinOrderId: d.payOrderId }
                ],
            },
            data: {
                status: d.status || "UNKNOWN",
                kucoinOrderId: d.payOrderId || undefined,
                walletAddress: d.address || undefined,
                cryptoAmount: d.cryptoAmount ? parseFloat(d.cryptoAmount) : undefined,
                updatedAt: new Date(),
            },
        });
    }
    return resp.data;
};
export default {
    createOnchainOrder,
    queryOnchainOrder,
};
