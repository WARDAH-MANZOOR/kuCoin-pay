import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function handleKucoinWebhookEvent(body) {
    switch (body.orderType) {
        /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4.1 TRADE WEBHOOK
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
        // case "TRADE":
        //   await prisma.order.updateMany({
        //     where: { kucoinOrderId: body.payOrderId },
        //     data: {
        //       status: body.status,
        //       reference: body.reference || null,
        //     },
        //   });
        //   break;
        case "TRADE":
            await prisma.order.updateMany({
                where: { kucoinOrderId: body.payOrderId },
                data: {
                    status: body.status,
                    orderAmount: parseFloat(body.orderAmount),
                    orderCurrency: body.orderCurrency,
                    goods: body.goods || [],
                    reference: body.reference || null,
                    subMerchantId: body.subMerchantId || null,
                    payTime: body.payTime ? BigInt(body.payTime) : null,
                    canRefundAmount: body.canRefundAmount
                        ? parseFloat(body.canRefundAmount)
                        : null,
                    refundCurrency: body.refundCurrency || null,
                    errorReason: body.errorReason || null,
                    payerUserId: body.payerUserId || null,
                    retrieveKycStatus: body.retrieveKycStatus ?? null,
                    payerDetail: body.payerDetail || null,
                },
            });
            break;
        /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4.2 REFUND WEBHOOK
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
        // case "REFUND":
        //   await prisma.refund.updateMany({
        //     where: { kucoinRefundId: body.refundId },
        //     data: {
        //       status: body.status,
        //       refundAmount: parseFloat(body.refundAmount || "0"),
        //       refundReason: body.refundReason || null,
        //     },
        //   });
        //   break;
        case "REFUND": {
            console.log("🔔 REFUND WEBHOOK RECEIVED:", body);
            await prisma.refund.updateMany({
                where: { kucoinRefundId: body.refundId },
                data: {
                    // KUCOIN → refundId
                    kucoinRefundId: body.refundId,
                    // MERCHANT + KUCOIN FIELDS
                    merchantId: body.merchantId || null,
                    subMerchantId: body.subMerchantId || null,
                    refundRequestId: body.requestId,
                    payID: body.payID,
                    // FLOAT FIELDS (IMPORTANT: undefined instead of null)
                    refundAmount: body.refundAmount !== undefined
                        ? parseFloat(body.refundAmount)
                        : undefined,
                    refundReason: body.refundReason || null,
                    reference: body.reference || null,
                    // REFUND STATUS
                    status: body.status || "SUCCEEDED",
                    // CURRENCY + AMOUNTS
                    refundCurrency: body.refundCurrency || null,
                    remainingRefundAmount: body.remainingRefundAmount !== undefined
                        ? parseFloat(body.remainingRefundAmount)
                        : undefined,
                    remainingRefundCurrency: body.remainingRefundCurrency || null,
                    // TIMESTAMPS
                    refundFinishTime: body.refundFinishTime
                        ? BigInt(body.refundFinishTime)
                        : undefined,
                    // ADVANCED OPTIONAL FIELDS
                    payerUserId: body.payerUserId || null,
                    retrieveKycStatus: body.retrieveKycStatus !== undefined
                        ? body.retrieveKycStatus
                        : undefined,
                    payerDetail: body.payerDetail || null,
                },
            });
            console.log("💾 Refund webhook saved to DB.");
            break;
        }
        /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4.3 PAYOUT WEBHOOK
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
        // case "PAYOUT":
        //   const payout = await prisma.payout.upsert({
        //     where: { requestId: body.requestId },
        //     update: {
        //       batchNo: body.batchNo,
        //       payoutType: body.payoutType,
        //       totalAmount: parseFloat(body.totalAmount),
        //       totalCount: body.totalCount,
        //       status: body.status,
        //     },
        //     create: {
        //       requestId: body.requestId,
        //       batchNo: body.batchNo,
        //       batchName: body.batchName,
        //       currency: body.currency,
        //       payoutType: body.payoutType,
        //       totalAmount: parseFloat(body.totalAmount),
        //       totalCount: body.totalCount,
        //       status: body.status,
        //     },
        //   });
        //   if (Array.isArray(body.withdrawDetailDtoList)) {
        //     for (const d of body.withdrawDetailDtoList) {
        //       await prisma.payoutDetail.upsert({
        //         where: { detailId: d.detailId },
        //         update: {
        //           receiverUID: d.receiverUID || null,
        //           receiverAddress: d.receiverAddress || null,
        //           amount: parseFloat(d.amount),
        //           remark: d.remark || null,
        //           status: d.status,
        //         },
        //         create: {
        //           detailId: d.detailId,
        //           payoutId: payout.id,
        //           receiverUID: d.receiverUID || null,
        //           receiverAddress: d.receiverAddress || null,
        //           amount: parseFloat(d.amount),
        //           remark: d.remark || null,
        //           status: d.status,
        //         },
        //       });
        //     }
        //   }
        //   break;
        case "PAYOUT": {
            console.log("🔔 PAYOUT WEBHOOK RECEIVED:", body);
            const payout = await prisma.payout.upsert({
                where: { requestId: body.requestId },
                update: {
                    batchNo: body.batchNo,
                    batchName: body.batchName,
                    payoutType: body.payoutType,
                    currency: body.currency,
                    chain: body.chain || null,
                    totalAmount: parseFloat(body.totalAmount),
                    totalCount: body.totalCount,
                    totalPaidAmount: body.totalPaidAmount ? parseFloat(body.totalPaidAmount) : null,
                    processingFee: body.processingFee ? parseFloat(body.processingFee) : null,
                    totalPayoutFee: body.totalPayoutFee ? parseFloat(body.totalPayoutFee) : null,
                    status: body.status,
                },
                create: {
                    requestId: body.requestId,
                    batchNo: body.batchNo,
                    batchName: body.batchName,
                    payoutType: body.payoutType,
                    currency: body.currency,
                    chain: body.chain || null,
                    totalAmount: parseFloat(body.totalAmount),
                    totalCount: body.totalCount,
                    totalPaidAmount: body.totalPaidAmount ? parseFloat(body.totalPaidAmount) : null,
                    processingFee: body.processingFee ? parseFloat(body.processingFee) : null,
                    totalPayoutFee: body.totalPayoutFee ? parseFloat(body.totalPayoutFee) : null,
                    status: body.status,
                },
            });
            if (Array.isArray(body.withdrawDetailDtoList)) {
                for (const d of body.withdrawDetailDtoList) {
                    await prisma.payoutDetail.upsert({
                        where: { detailId: d.detailId },
                        update: {
                            receiverUID: d.receiverUID || null,
                            receiverAddress: d.receiverAddress || null,
                            amount: parseFloat(d.amount),
                            remark: d.remark || null,
                            status: d.status,
                            payoutFee: d.payoutFee ? parseFloat(d.payoutFee) : null,
                            payoutId: payout.id,
                        },
                        create: {
                            detailId: d.detailId,
                            receiverUID: d.receiverUID || null,
                            receiverAddress: d.receiverAddress || null,
                            amount: parseFloat(d.amount),
                            remark: d.remark || null,
                            status: d.status,
                            payoutFee: d.payoutFee ? parseFloat(d.payoutFee) : null,
                            payoutId: payout.id,
                        },
                    });
                }
            }
            console.log("💾 Payout webhook saved!");
            break;
        }
        /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4.4 ONCHAIN PAYMENT WEBHOOK
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
        case "ONCHAIN_PAYMENT":
            await prisma.onchainOrder.updateMany({
                where: { requestId: body.requestId },
                data: {
                    subMerchantId: body.subMerchantId || null,
                    status: body.status,
                    chain: body.chain,
                    cryptoCurrency: body.currency,
                    cryptoAmount: parseFloat(body.paymentAmount),
                    reference: body.reference || null,
                    kucoinOrderId: body.payOrderId,
                },
            });
            break;
        /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4.5 ONCHAIN REFUND WEBHOOK
          (mapped to Refund table)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
        case "ONCHAIN_REFUND":
            await prisma.refund.updateMany({
                where: { kucoinRefundId: body.refundId },
                data: {
                    status: body.status,
                    refundAmount: parseFloat(body.refundAmount),
                    refundReason: body.refundReason || null,
                },
            });
            break;
        default:
            console.warn("⚠️ Unknown webhook event:", body.orderType);
    }
}
export default {
    handleKucoinWebhookEvent
};
