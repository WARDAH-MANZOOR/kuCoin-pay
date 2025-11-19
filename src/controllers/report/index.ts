import { Request, Response } from "express";
import { reportService } from "../../services/index.js";

import { mapKucoinResponse } from "../../utils/kucoinMapper.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";

/**
 * Controller: Reconciliation Report Query API (Chapter 3.8)
 */
export const queryReconciliationReports = async (req: Request, res: Response) => {
  try {
    const { reportType, startDate, endDate } = req.body;

    console.log("📥 Incoming Reconciliation Report Request:", req.body);

    // 🔹 Call service
    const data = await reportService.fetchReconciliationReports(
      reportType,
      startDate,
      endDate
    );

    // ⭐ Apply KuCoin mapping (status + refundStatus + errorCode)
    const mapped = mapKucoinResponse(data);

    res.status(200).json({
      success: true,
      message: "Reconciliation report fetched successfully",
      data: mapped,
    });

  } catch (err: any) {
    console.error("❌ Error fetching reconciliation report:", err.message);

    const code = err.response?.data?.code as keyof typeof ERROR_CODES;
    const message = ERROR_CODES[code] || err.message;

    res.status(500).json({
      success: false,
      errorCode: code,
      errorMessage: message,
    });
  }
};

export default {
  queryReconciliationReports,
};
