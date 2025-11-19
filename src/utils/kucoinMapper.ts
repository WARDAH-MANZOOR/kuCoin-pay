// src/utils/kucoinMapper.ts

import { ORDER_STATUS, REFUND_STATUS } from "../constants/status.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

/**
 * Converts KuCoin API response into human-friendly format
 */
export const mapKucoinResponse = (response: any) => {
  if (!response) return response;

  const data = response.data;

  // ⭐ Map ORDER Status
  if (data?.status && data.status in ORDER_STATUS) {
    data.statusMessage = ORDER_STATUS[data.status as keyof typeof ORDER_STATUS];
  }

  // ⭐ Map REFUND Status (for refund APIs)
  if (data?.refundStatus && data.refundStatus in REFUND_STATUS) {
    data.refundStatusMessage = REFUND_STATUS[data.refundStatus as keyof typeof REFUND_STATUS];
  }

  // ⭐ Map error codes
  if (response.code && ERROR_CODES[response.code as keyof typeof ERROR_CODES]) {
    response.errorMessage = ERROR_CODES[response.code as keyof typeof ERROR_CODES];
  }

  return response;
};
