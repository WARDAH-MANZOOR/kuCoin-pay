import { PrismaClient } from "@prisma/client";
import { refundService } from "services/index.js";
import { mapKucoinResponse } from "../../utils/kucoinMapper.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
const prisma = new PrismaClient();
/**
 * Controller: Refund Order (Chapter 3.5)
 * Initiates a refund (full or partial) for a KuCoin Pay order.
 * Handles HTTP request/response for initiating refunds.
 */
// export const refundOrder = async (req: Request, res: Response) => {
//   try {
//     console.log("📥 Incoming Refund Request:", req.body);
//     const data = await refundService.refundOrder(req.body);
//     res.status(200).json({
//       success: true,
//       message: "Refund request processed successfully",
//       data,
//     });
//   } catch (err: any) {
//     console.error("❌ Error processing refund:", err.message);
//     if (err.response) {
//       console.error("📩 KuCoin Response Data:", err.response.data);
//       console.error("🌐 Status:", err.response.status);
//     }
//     res.status(500).json({
//       success: false,
//       error: err.message || "Internal Server Error",
//     });
//   }
// };
export const refundOrder = async (req, res) => {
    try {
        console.log("📥 Incoming Refund Request:", req.body);
        const data = await refundService.refundOrder(req.body);
        // ⭐ Apply mapping (refundStatus + errors)
        const mapped = mapKucoinResponse(data);
        res.status(200).json({
            success: true,
            message: "Refund request processed successfully",
            data: mapped,
        });
    }
    catch (err) {
        console.error("❌ Error processing refund:", err.message);
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
 * Query Refund API – Chapter 3.6
 * Handles HTTP input validation and response sending.
 * Allows merchants to query the status and details of a refund.
 * This API lets you check refund status using either:
    refundId (from KuCoin Pay’s response to refund/create), or
    requestId (the merchant’s own refund request ID).
*/
// export const queryRefund = async (req: Request, res: Response) => {
//   try {
//     console.log("📥 Incoming Refund Query Request:", req.body);
//     const data = await refundService.queryRefund(req.body);
//     res.status(200).json({
//       success: true,
//       message: "Refund status queried successfully",
//       data,
//     });
//   } catch (err: any) {
//     console.error("❌ Error querying refund:", err.message);
//     if (err.response) {
//       console.error("📩 KuCoin Response Data:", err.response.data);
//       console.error("🌐 Status:", err.response.status);
//     }
//     res.status(500).json({
//       success: false,
//       error: err.message || "Internal Server Error",
//     });
//   }
// };
export const queryRefund = async (req, res) => {
    try {
        console.log("📥 Incoming Refund Query Request:", req.body);
        const data = await refundService.queryRefund(req.body);
        // ⭐ Apply mapping
        const mapped = mapKucoinResponse(data);
        res.status(200).json({
            success: true,
            message: "Refund status retrieved successfully",
            data: mapped,
        });
    }
    catch (err) {
        console.error("❌ Error querying refund:", err.message);
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
 * Controller: Query Refund Order List (Chapter 3.7)
 * Handles Express HTTP request/response for refund list retrieval.
 * Retrieves paginated list of refund orders within a specific time range.
 */
// export const queryRefundList = async (req: Request, res: Response) => {
//   try {
//     console.log("📥 Incoming Refund List Request:", req.body);
//     const data = await refundService.queryRefundList(req.body);
//     res.status(200).json({
//       success: true,
//       message: "Refund list retrieved successfully",
//       data,
//     });
//   } catch (err: any) {
//     console.error("❌ Error querying refund list:", err.message);
//     if (err.response) {
//       console.error("📩 KuCoin Response Data:", err.response.data);
//       console.error("🌐 Status:", err.response.status);
//     }
//     res.status(500).json({
//       success: false,
//       error: err.message || "Internal Server Error",
//     });
//   }
// };
export const queryRefundList = async (req, res) => {
    try {
        console.log("📥 Incoming Refund List Request:", req.body);
        const data = await refundService.queryRefundList(req.body);
        // ⭐ Map every single refund entry
        if (Array.isArray(data?.data)) {
            data.data = data.data.map((row) => mapKucoinResponse({ data: row }).data);
        }
        res.status(200).json({
            success: true,
            message: "Refund list retrieved successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error querying refund list:", err.message);
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
    refundOrder,
    queryRefund,
    queryRefundList
};
