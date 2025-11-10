import axios from "axios";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { sign } from "../../utils/signature.js"; // your RSA-SHA256 signer

const prisma = new PrismaClient();

/**
 * Service: Fetch reconciliation reports (Chapter 3.8)
 * Docs reference: /api/v1/report/query
 */
export const fetchReconciliationReports = async (
  reportType: string,
  startDate: string,
  endDate: string
) => {
  const timestamp = Date.now();

  // 🔹 Step 1: Validate input
  if (!reportType || !startDate || !endDate) {
    throw new Error("reportType, startDate, and endDate are required.");
  }

  // 🔹 Step 2: Prepare signature params
  const params = {
    apiKey: process.env.KUCOIN_API_KEY,
    endDate,
    reportType,
    startDate,
    timestamp,
  };
  console.log("🧩 Step 1: Params prepared =>", params);

  // 🔹 Step 3: Build signature string (order-sensitive)
  const signString = `apiKey=${params.apiKey}&endDate=${endDate}&reportType=${reportType}&startDate=${startDate}&timestamp=${timestamp}`;
  console.log("🧾 Step 2: Signature string =>", signString);

  // 🔹 Step 4: Load private key
  const privateKeyPath = path.resolve("src/keys/merchant_private.pem");
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  console.log("🔑 Step 3: Private key loaded from =>", privateKeyPath);

  // 🔹 Step 5: Generate signature
  const signature = sign(signString, privateKey);
  console.log("🧠 Step 4: Signature (first 60 chars):", signature.slice(0, 60) + "...");

  // 🔹 Step 6: Prepare headers
  const headers = {
    "PAY-API-SIGN": signature,
    "PAY-API-KEY": process.env.KUCOIN_API_KEY,
    "PAY-API-VERSION": "1.0",
    "PAY-API-TIMESTAMP": timestamp.toString(),
    "Content-Type": "application/json",
  };
  console.log("📦 Step 5: Headers =>", headers);

  // 🔹 Step 7: Prepare body
  const body = { reportType, startDate, endDate };
  console.log("🧰 Step 6: Body =>", JSON.stringify(body, null, 2));

  // 🔹 Step 8: Call KuCoin Pay API
  const endpoint = `${process.env.KUCOIN_BASE_URL}/api/v1/report/query`;
  console.log("🚀 Step 7: Sending request to KuCoin API...");
  console.log("➡️ Endpoint:", endpoint);

  const response = await axios.post(endpoint, body, { headers });
  console.log("✅ Step 8: KuCoin API response =>", response.data);

  // 🔹 Step 9: Save reports in DB
  const reports = response.data?.data || [];
  if (reports.length > 0) {
    console.log(`💾 Step 9: Syncing ${reports.length} reports...`);
    for (const report of reports) {
      await prisma.report.upsert({
        where: {
          reportType_reportDate: {
            reportType: report.reportType,
            reportDate: report.reportDate,
          },
        },
        update: {
          fileName: report.fileName || null,
          downloadUrl: report.downloadUrl || null,
          status: report.status || "UNKNOWN",
        },
        create: {
          reportType: report.reportType,
          fileName: report.fileName || null,
          reportDate: report.reportDate,
          downloadUrl: report.downloadUrl || null,
          status: report.status || "PENDING",
        },
      });
    }
    console.log("✅ Step 10: Reports synced successfully to DB.");
  } else {
    console.log("ℹ️ No reports found for this range.");
  }

  return response.data;
};

export default {
  fetchReconciliationReports,
};