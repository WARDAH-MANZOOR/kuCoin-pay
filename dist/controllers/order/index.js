import { PrismaClient } from "@prisma/client";
import { orderService } from "services/index.js";
import { mapKucoinResponse } from "../../utils/kucoinMapper.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
const prisma = new PrismaClient();
/**
 * Controller: Create Order (Chapter 3----3.1)
 * Handles HTTP layer only — validation + response.
 */
export const createOrder = async (req, res) => {
    try {
        const data = await orderService.createOrder(req.body);
        // ⭐ Apply mapping
        const mapped = mapKucoinResponse(data);
        res.status(200).json({
            success: true,
            message: "Order created successfully",
            data: mapped,
        });
    }
    catch (err) {
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
 * Controller: Query Order (Chapter 3.2)
 * Validates request and delegates to the service.
 */
export const queryOrder = async (req, res) => {
    try {
        const data = await orderService.queryOrder(req.body);
        const mapped = mapKucoinResponse(data);
        res.status(200).json({
            success: true,
            message: "Order query successful",
            data: mapped,
        });
    }
    catch (err) {
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
 * Controller: Query Order List (Chapter 3.3)
 * Handles request validation & response handling only.
 */
export const queryOrderList = async (req, res) => {
    try {
        const data = await orderService.queryOrderList(req.body);
        // ⭐ Map every entry
        if (Array.isArray(data?.data)) {
            data.data = data.data.map((row) => mapKucoinResponse({ data: row }).data);
        }
        res.status(200).json({
            success: true,
            message: "Order list retrieved successfully",
            data,
        });
    }
    catch (err) {
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
 * Controller: Close Order (Chapter 3.4)
 * Handles HTTP request/response.
 * Enables merchant to close an unpaid order before expiry.
 */
export const closeOrder = async (req, res) => {
    try {
        const data = await orderService.closeOrder(req.body);
        const mapped = mapKucoinResponse(data);
        res.status(200).json({
            success: true,
            message: "Order closed successfully",
            data: mapped,
        });
    }
    catch (err) {
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
    createOrder,
    queryOrder,
    queryOrderList,
    closeOrder,
};
