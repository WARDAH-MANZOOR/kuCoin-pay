import { reportService } from "../../services/index.js";
/**
 * Controller: Reconciliation Report Query API (Chapter 3.8)
 */
export const queryReconciliationReports = async (req, res) => {
    try {
        const { reportType, startDate, endDate } = req.body;
        console.log("📥 Incoming Request:", req.body);
        // 🔹 Call service
        const data = await reportService.fetchReconciliationReports(reportType, startDate, endDate);
        res.status(200).json({
            success: true,
            message: "Reconciliation report fetched successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error fetching reconciliation report:", err.message);
        if (err.response) {
            console.error("📩 KuCoin Response Data:", err.response.data);
            console.error("🌐 Status:", err.response.status);
        }
        res.status(500).json({
            success: false,
            error: err.message || "Internal Server Error",
        });
    }
};
export default {
    queryReconciliationReports,
};
