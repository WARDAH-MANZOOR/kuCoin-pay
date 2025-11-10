import { payoutOrderService } from "services/index.js";
/**
 * Controller: Create Payout Order (Chapter 3.9)
 * Handles HTTP request and response for creating payout batches.
 */
export const createPayoutOrder = async (req, res) => {
    try {
        console.log("📥 Incoming Payout Order Request:", req.body);
        const data = await payoutOrderService.createPayoutOrder(req.body);
        res.status(200).json({
            success: true,
            message: "Payout order created successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error creating payout order:", err.message);
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
/**
 * Controller: Query Payout Info (Chapter 3.10)
 */
export const queryPayoutInfo = async (req, res) => {
    try {
        console.log("📥 Incoming Query Payout Info Request:", req.body);
        const data = await payoutOrderService.queryPayoutInfo(req.body);
        res.status(200).json({
            success: true,
            message: "Payout info retrieved successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error querying payout info:", err.message);
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
/**
 * Controller: Query Payout Detail (Chapter 3.11)
 */
export const queryPayoutDetail = async (req, res) => {
    try {
        console.log("📥 Incoming Query Payout Detail Request:", req.body);
        const data = await payoutOrderService.queryPayoutDetail(req.body);
        res.status(200).json({
            success: true,
            message: "Payout detail retrieved successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error querying payout detail:", err.message);
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
    createPayoutOrder,
    queryPayoutInfo,
    queryPayoutDetail
};
