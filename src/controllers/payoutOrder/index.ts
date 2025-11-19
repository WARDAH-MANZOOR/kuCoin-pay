import { Request, Response } from "express";
import { payoutOrderService } from "services/index.js";

// ⭐ Add mapping + error codes
import { mapKucoinResponse } from "../../utils/kucoinMapper.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";

/**
 * Controller: Create Payout Order (Chapter 3.9)
 */
export const createPayoutOrder = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Payout Order Request:", req.body);

    const data = await payoutOrderService.createPayoutOrder(req.body);

    // ⭐ Apply status + error mapping
    const mapped = mapKucoinResponse(data);

    res.status(200).json({
      success: true,
      message: "Payout order created successfully",
      data: mapped,
    });

  } catch (err: any) {
    console.error("❌ Error creating payout order:", err.message);

    const code = err.response?.data?.code as keyof typeof ERROR_CODES;
    const message = ERROR_CODES[code] || err.message;

    res.status(500).json({
      success: false,
      errorCode: code,
      errorMessage: message,
    });
  }
};

/**
 * Controller: Query Payout Info (Chapter 3.10)
 */
export const queryPayoutInfo = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Query Payout Info Request:", req.body);

    const data = await payoutOrderService.queryPayoutInfo(req.body);

    // ⭐ Apply mapping
    const mapped = mapKucoinResponse(data);

    res.status(200).json({
      success: true,
      message: "Payout info retrieved successfully",
      data: mapped,
    });

  } catch (err: any) {
    console.error("❌ Error querying payout info:", err.message);

    const code = err.response?.data?.code as keyof typeof ERROR_CODES;
    const message = ERROR_CODES[code] || err.message;

    res.status(500).json({
      success: false,
      errorCode: code,
      errorMessage: message,
    });
  }
};

/**
 * Controller: Query Payout Detail (Chapter 3.11)
 */
export const queryPayoutDetail = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Query Payout Detail Request:", req.body);

    const data = await payoutOrderService.queryPayoutDetail(req.body);

    // ⭐ Apply mapping
    const mapped = mapKucoinResponse(data);

    res.status(200).json({
      success: true,
      message: "Payout detail retrieved successfully",
      data: mapped,
    });

  } catch (err: any) {
    console.error("❌ Error querying payout detail:", err.message);

    const code = err.response?.data?.code as keyof typeof ERROR_CODES;
    const message = ERROR_CODES[code] || err.message;

    res.status(500).json({
      success: false,
      errorCode: code,
      errorMessage: message,
    });
  }
};

/**
 * Controller: Query On-Chain Currency (Chapter 3.12)
 */
export const queryOnchainCurrency = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming On-Chain Currency Query Request:", req.body);

    const data = await payoutOrderService.queryOnchainCurrency(req.body);

    // ⭐ Apply mapping
    const mapped = mapKucoinResponse(data);

    res.status(200).json({
      success: true,
      message: "On-chain currency details retrieved successfully",
      data: mapped,
    });

  } catch (err: any) {
    console.error("❌ Error querying on-chain currencies:", err.message);

    const code = err.response?.data?.code as keyof typeof ERROR_CODES;
    const message = ERROR_CODES[code] || err.message;

    res.status(500).json({
      success: false,
      errorCode: code,
      errorMessage: message,
    });
  }
};

/**
 * Controller: Query Onchain Currency Quote (Chapter 3.13)
 */
export const queryOnchainCurrencyQuote = async (req: Request, res: Response) => {
  try {
    console.log("📥 Incoming Onchain Quote Request:", req.body);

    const data = await payoutOrderService.queryOnchainCurrencyQuote(req.body);

    // ⭐ Apply mapping
    const mapped = mapKucoinResponse(data);

    res.status(200).json({
      success: true,
      message: "Onchain currency quote retrieved successfully",
      data: mapped,
    });

  } catch (err: any) {
    console.error("❌ Error querying onchain currency quote:", err.message);

    const code = err.response?.data?.code as keyof typeof ERROR_CODES;
    const message = ERROR_CODES[code] || err.message;

    res.status(500).json({
      success: false,
      errorCode: code,
      errorMessage: message,
    });
  }
};

export default {
  createPayoutOrder,
  queryPayoutInfo,
  queryPayoutDetail,
  queryOnchainCurrency,
  queryOnchainCurrencyQuote
};
