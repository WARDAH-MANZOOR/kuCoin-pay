export const ORDER_STATUS = {
    CREATED: "Transaction created, awaiting payment",
    CANCELLED: "Transaction cancelled",
    FAILED: "Payment failed",
    PROCESSING: "Payment is being processed",
    USER_PAY_COMPLETED: "User payment completed, can ship now",
    SUCCEEDED: "Transaction completed",
};
export const REFUND_STATUS = {
    PROCESSING: "Refund is being processed",
    SUCCEEDED: "Refund successful",
    FAILED: "Refund failed",
    REFUND_PART: "Partial refund initiated",
    REFUND_FULL: "Full refund completed",
};
