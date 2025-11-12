import { Request, Response } from "express";
import { onchainOrderService } from "services/index.js";

export const createOnchainOrder = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Create Onchain Order Request:", req.body);
    const data = await onchainOrderService.createOnchainOrder(req.body);

    res.status(200).json({
      success: true,
      message: "Onchain order created successfully",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error creating onchain order:", err.message);
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
  createOnchainOrder,
};
