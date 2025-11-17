import crypto from "crypto";
export function encryptAES(plainText, secretKeyBase64) {
    const keyBytes = Buffer.from(secretKeyBase64, "base64");
    // random 16-byte IV (Java example also does this)
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", keyBytes, iv);
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(plainText, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // Java format = IV + cipherBytes → base64
    const finalBuffer = Buffer.concat([iv, encrypted]);
    return finalBuffer.toString("base64");
}
