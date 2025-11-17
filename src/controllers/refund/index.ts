
import { Request, Response } from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import {  sign } from "../../utils/signature.js";
import { PrismaClient } from "@prisma/client";
import { refundService } from "services/index.js";

const prisma = new PrismaClient();

/**
 * Controller: Refund Order (Chapter 3.5)
 * Initiates a refund (full or partial) for a KuCoin Pay order.
 * Handles HTTP request/response for initiating refunds.
 */
export const refundOrder = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Refund Request:", req.body);

    const data = await refundService.refundOrder(req.body);

    res.status(200).json({
      success: true,
      message: "Refund request processed successfully",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error processing refund:", err.message);
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
 * Query Refund API – Chapter 3.6
 * Handles HTTP input validation and response sending.
 * Allows merchants to query the status and details of a refund.
 * This API lets you check refund status using either:
    refundId (from KuCoin Pay’s response to refund/create), or
    requestId (the merchant’s own refund request ID).
*/
export const queryRefund = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Refund Query Request:", req.body);

    const data = await refundService.queryRefund(req.body);

    res.status(200).json({
      success: true,
      message: "Refund status queried successfully",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error querying refund:", err.message);
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
 * Controller: Query Refund Order List (Chapter 3.7)
 * Handles Express HTTP request/response for refund list retrieval.
 * Retrieves paginated list of refund orders within a specific time range.
 */
export const queryRefundList = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Refund List Request:", req.body);

    const data = await refundService.queryRefundList(req.body);

    res.status(200).json({
      success: true,
      message: "Refund list retrieved successfully",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error querying refund list:", err.message);
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

  refundOrder,
  queryRefund,
  queryRefundList
};
