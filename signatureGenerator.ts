import fs from "fs";
import path from "path";
import { sign, verify } from "./src/utils/signature.js";
const params = {
  apiKey: "APK_68f70c7296d6c2000159c509",
  orderAmount: 20,
  orderCurrency: "USDT",
  reference: "ref123",
  requestId: "req-20250101",
  source: "WEB",
  timestamp: Date.now(),
};

const dataString = Object.entries(params)
  .filter(([_, v]) => v !== "" && v !== undefined)
  .map(([k, v]) => `${k}=${v}`)
  .join("&");

// Keys
const merchantPrivateKey = fs.readFileSync("./src/keys/merchant_private.pem", "utf-8");
const kuCoinPublicKey = fs.readFileSync("./src/keys/kuCoin_public.pem", "utf-8");

const signature = sign(dataString, merchantPrivateKey);
console.log("Generated CreateOrder Signature:", signature);


const isCreateOrderVerified = verify(dataString, signature, kuCoinPublicKey);
console.log("✔ CreateOrder Signature Verified?", isCreateOrderVerified);