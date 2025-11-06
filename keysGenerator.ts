// generateKeys.ts
import { generateKeyPairSync } from "crypto";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// 🧩 because "__dirname" doesn't exist in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🧠 utility to safely save PEM files
function saveKey(name: string, type: "private" | "public", key: string): void {
  const dirPath = path.join(__dirname, "src", "keys");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const filePath = path.join(dirPath, `${name}_${type}.pem`);
  fs.writeFileSync(filePath, key);
  console.log(`✅ Saved: ${filePath}`);
}

// 🗝 generate a pair of keys (RSA 2048)
function generateKeys(prefix: string): void {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  saveKey(prefix, "private", privateKey);
  saveKey(prefix, "public", publicKey);
}

// ✅ Create merchant + kuCoin key pairs
generateKeys("merchant");
generateKeys("kuCoin");
