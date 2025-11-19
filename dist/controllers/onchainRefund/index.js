import { onchainRefundService } from "services/index.js";
// ⭐ Chapter-6 mapping
import { mapKucoinResponse } from "../../utils/kucoinMapper.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
/**
 * Create Onchain Refund Order
 */
export const createOnchainRefundOrder = async (req, res) => {
    try {
        console.log("📥 Incoming Create Onchain Refund Order Request:", req.body);
        const data = await onchainRefundService.createOnchainRefundOrder(req.body);
        // ⭐ Apply mapping (status, refundStatus, errorMessage)
        const mapped = mapKucoinResponse(data);
        res.status(200).json({
            success: true,
            message: "Onchain refund order created successfully",
            data: mapped,
        });
    }
    catch (err) {
        console.error("❌ Error creating onchain refund order:", err.message);
        const code = err.response?.data?.code;
        const message = ERROR_CODES[code] || err.message;
        res.status(500).json({
            success: false,
            errorCode: code,
            errorMessage: message,
        });
    }
};
/**
 * Query Onchain Refund Order
 */
export const queryOnchainRefundOrder = async (req, res) => {
    try {
        console.log("📥 Incoming Query Onchain Refund:", req.body);
        const data = await onchainRefundService.queryOnchainRefundOrder(req.body);
        // ⭐ Apply mapping
        const mapped = mapKucoinResponse(data);
        res.status(200).json({
            success: true,
            message: "Onchain refund queried successfully",
            data: mapped,
        });
    }
    catch (err) {
        console.error("❌ Error querying onchain refund:", err.message);
        const code = err.response?.data?.code;
        const message = ERROR_CODES[code] || err.message;
        res.status(500).json({
            success: false,
            errorCode: code,
            errorMessage: message,
        });
    }
};
/**
 * Query Onchain Refund Order List
 */
export const queryOnchainRefundOrderList = async (req, res) => {
    try {
        console.log("📥 Incoming Query Onchain Refund List:", req.body);
        const data = await onchainRefundService.queryOnchainRefundOrderList(req.body);
        // ⭐ Map each entry of list
        if (Array.isArray(data?.data)) {
            data.data = data.data.map((row) => mapKucoinResponse({ data: row }).data);
        }
        res.status(200).json({
            success: true,
            message: "Onchain refund list retrieved successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error querying onchain refund list:", err.message);
        const code = err.response?.data?.code;
        const message = ERROR_CODES[code] || err.message;
        res.status(500).json({
            success: false,
            errorCode: code,
            errorMessage: message,
        });
    }
};
export default {
    createOnchainRefundOrder,
    queryOnchainRefundOrder,
    queryOnchainRefundOrderList
};
