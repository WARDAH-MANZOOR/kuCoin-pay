import crypto from "crypto";
export function decryptAES(cipherText, secretKeyBase64) {
    const encryptBytes = Buffer.from(cipherText, "base64");
    const keyBytes = Buffer.from(secretKeyBase64, "base64");
    const iv = encryptBytes.subarray(0, 16); // first 16 bytes
    const cipherBytes = encryptBytes.subarray(16); // remaining bytes
    const decipher = crypto.createDecipheriv("aes-256-cbc", keyBytes, iv);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(cipherBytes, undefined, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
