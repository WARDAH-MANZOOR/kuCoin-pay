// src/controllers/onchainRefundController.ts
import { Request, Response } from "express";
import { onchainRefundService } from "services/index.js";

export const createOnchainRefundOrder = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Create Onchain Refund Order Request:", req.body);
    const data = await onchainRefundService.createOnchainRefundOrder(req.body);

    res.status(200).json({
      success: true,
      message: "Onchain refund order created successfully",
      data,
    });
  } catch (err: any) {
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

export default {
  createOnchainRefundOrder,
};
