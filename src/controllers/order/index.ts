import { Request, Response } from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { buildSignatureString, sign } from "../../utils/signature.js";
import { PrismaClient } from "@prisma/client";
import { orderService } from "services/index.js";

const prisma = new PrismaClient();

/**
 * Controller: Create Order (Chapter 3----3.1)
 * Handles HTTP layer only — validation + response.
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Order Request:", req.body);

    const data = await orderService.createOrder(req.body);

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error creating order:", err.message);
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
 * Controller: Query Order (Chapter 3.2)
 * Validates request and delegates to the service.
 */
export const queryOrder = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Query Order Request:", req.body);

    const data = await orderService.queryOrder(req.body);

    res.status(200).json({
      success: true,
      message: "Order query successful",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error querying order:", err.message);
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
 * Controller: Query Order List (Chapter 3.3)
 * Handles request validation & response handling only.
 */
export const queryOrderList = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Query Order List Request:", req.body);

    const data = await orderService.queryOrderList(req.body);

    res.status(200).json({
      success: true,
      message: "Order list retrieved and synced successfully",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error querying order list:", err.message);
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
 * Controller: Close Order (Chapter 3.4)
 * Handles HTTP request/response.
 * Enables merchant to close an unpaid order before expiry.
 */
export const closeOrder = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Close Order Request:", req.body);

    const data = await orderService.closeOrder(req.body);

    res.status(200).json({
      success: true,
      message: "Order closed successfully",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error closing order:", err.message);
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
  createOrder,
  queryOrder,
  queryOrderList,
  closeOrder,
};
