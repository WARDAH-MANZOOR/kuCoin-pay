import { encryptAES } from "./src/utils/aesEncrypt.js";
import { decryptAES } from "./src/utils/aesDecrypt.js";

const key = "9M8LJx4Txj0iF3g8y2Sxudjv84p0bN74RFnqxB1gD4U="

const text = JSON.stringify({
  firstName: "Wardah",
  lastName: "Manzoor",
  countryCode: "PK",
  dateOfBirth:"1994-02-04",
  expiryDate:"2099-1231",
});

console.log("Original:", text);

// encrypt
const encrypted = encryptAES(text, key);
console.log("Encrypted:", encrypted);

// decrypt
const decrypted = decryptAES(encrypted, key);
console.log("Decrypted:", decrypted);
