import { Request, Response } from "express";
import { payoutOrderService } from "services/index.js";


/**
 * Controller: Create Payout Order (Chapter 3.9)
 * Handles HTTP request and response for creating payout batches.
 */
export const createPayoutOrder = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Payout Order Request:", req.body);

    const data = await payoutOrderService.createPayoutOrder(req.body);

    res.status(200).json({
      success: true,
      message: "Payout order created successfully",
      data,
    });
  } catch (err: any) {
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

export default {
  createPayoutOrder,
};
