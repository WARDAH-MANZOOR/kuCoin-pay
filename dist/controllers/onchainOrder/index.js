import { onchainOrderService } from "services/index.js";
import { mapKucoinResponse } from "../../utils/kucoinMapper.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
// export const createOnchainOrder = async (req: Request, res: Response) => {
//   try {
//     console.log("📥 Incoming Create Onchain Order Request:", req.body);
//     const data = await onchainOrderService.createOnchainOrder(req.body);
//     res.status(200).json({
//       success: true,
//       message: "Onchain order created successfully",
//       data,
//     });
//   } catch (err: any) {
//     console.error("❌ Error creating onchain order:", err.message);
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
export const createOnchainOrder = async (req, res) => {
    try {
        console.log("📥 Incoming Create Onchain Order Request:", req.body);
        const data = await onchainOrderService.createOnchainOrder(req.body);
        // ⭐ Apply status + error mapping
        const mapped = mapKucoinResponse(data);
        res.status(200).json({
            success: true,
            message: "Onchain order created successfully",
            data: mapped,
        });
    }
    catch (err) {
        console.error("❌ Error creating onchain order:", err.message);
        const code = err.response?.data?.code;
        const message = ERROR_CODES[code] || err.message;
        res.status(500).json({
            success: false,
            errorCode: code,
            errorMessage: message,
        });
    }
}; /**
 * Controller: Query Onchain Order
 * Retrieve onchain payment info
 * Route: GET /api/v1/onchain/payment/info
 */
// export const queryOnchainOrder = async (req: Request, res: Response) => {
//   try {
//     console.log("📥 Incoming Query Onchain Order Request:", req.body);
//     const data = await onchainOrderService.queryOnchainOrder(req.body);
//     res.status(200).json({
//       success: true,
//       message: "Onchain order queried successfully",
//       data,
//     });
//   } catch (err: any) {
//     console.error("❌ Error querying onchain order:", err.message);
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
export const queryOnchainOrder = async (req, res) => {
    try {
        console.log("📥 Incoming Query Onchain Order Request:", req.body);
        const data = await onchainOrderService.queryOnchainOrder(req.body);
        // ⭐ Apply mapping
        const mapped = mapKucoinResponse(data);
        res.status(200).json({
            success: true,
            message: "Onchain order queried successfully",
            data: mapped,
        });
    }
    catch (err) {
        console.error("❌ Error querying onchain order:", err.message);
        const code = err.response?.data?.code;
        const message = ERROR_CODES[code] || err.message;
        res.status(500).json({
            success: false,
            errorCode: code,
            errorMessage: message,
        });
    }
}; /**
 * Controller: Query Onchain Order List
 * Route: POST /api/v1/onchain/payment/query
 */
// export const queryOnchainOrderList = async (req: Request, res: Response) => {
//   try {
//     console.log("📥 Incoming Query Onchain Order List Request:", req.body);
//     const data = await onchainOrderService.queryOnchainOrderList(req.body);
//     res.status(200).json({
//       success: true,
//       message: "Onchain order list retrieved successfully",
//       data,
//     });
//   } catch (err: any) {
//     console.error("❌ Error fetching onchain order list:", err.message);
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
export const queryOnchainOrderList = async (req, res) => {
    try {
        console.log("📥 Incoming Query Onchain Order List Request:", req.body);
        const data = await onchainOrderService.queryOnchainOrderList(req.body);
        // ⭐ Map each row in the list
        if (Array.isArray(data?.data)) {
            data.data = data.data.map((row) => mapKucoinResponse({ data: row }).data);
        }
        res.status(200).json({
            success: true,
            message: "Onchain order list retrieved successfully",
            data,
        });
    }
    catch (err) {
        console.error("❌ Error fetching onchain order list:", err.message);
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
    createOnchainOrder,
    queryOnchainOrder,
    queryOnchainOrderList
};
