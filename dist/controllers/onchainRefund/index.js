import { onchainRefundService } from "services/index.js";
export const createOnchainRefundOrder = async (req, res) => {
    try {
        console.log("📥 Incoming Create Onchain Refund Order Request:", req.body);
        const data = await onchainRefundService.createOnchainRefundOrder(req.body);
        res.status(200).json({
            success: true,
            message: "Onchain refund order created successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error creating onchain refund order:", err.message);
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
export const queryOnchainRefundOrder = async (req, res) => {
    try {
        console.log("📥 Incoming Query Onchain Refund:", req.body);
        const data = await onchainRefundService.queryOnchainRefundOrder(req.body);
        res.status(200).json({
            success: true,
            message: "Onchain refund queried successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error querying onchain refund:", err.message);
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
export const queryOnchainRefundOrderList = async (req, res) => {
    try {
        console.log("📥 Incoming Query Onchain Refund List:", req.body);
        const data = await onchainRefundService.queryOnchainRefundOrderList(req.body);
        res.status(200).json({
            success: true,
            message: "Onchain refund list retrieved successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error:", err.message);
        if (err.response) {
            console.error("📩 KuCoin Response:", err.response.data);
        }
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};
export default {
    createOnchainRefundOrder,
    queryOnchainRefundOrder,
    queryOnchainRefundOrderList
};
