import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function handleKucoinWebhookEvent(body) {
    switch (body.orderType) {
        /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4.1 TRADE WEBHOOK
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
        case "TRADE":
            await prisma.order.updateMany({
                where: { kucoinOrderId: body.payOrderId },
                data: {
                    status: body.status,
                    reference: body.reference || null,
                },
            });
            break;
        /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4.2 REFUND WEBHOOK
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
        case "REFUND":
            await prisma.refund.updateMany({
                where: { kucoinRefundId: body.refundId },
                data: {
                    status: body.status,
                    refundAmount: parseFloat(body.refundAmount || "0"),
                    refundReason: body.refundReason || null,
                },
            });
            break;
        /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4.3 PAYOUT WEBHOOK
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
        case "PAYOUT":
            const payout = await prisma.payout.upsert({
                where: { requestId: body.requestId },
                update: {
                    batchNo: body.batchNo,
                    payoutType: body.payoutType,
                    totalAmount: parseFloat(body.totalAmount),
                    totalCount: body.totalCount,
                    status: body.status,
                },
                create: {
                    requestId: body.requestId,
                    batchNo: body.batchNo,
                    batchName: body.batchName,
                    currency: body.currency,
                    payoutType: body.payoutType,
                    totalAmount: parseFloat(body.totalAmount),
                    totalCount: body.totalCount,
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
                        },
                        create: {
                            detailId: d.detailId,
                            payoutId: payout.id,
                            receiverUID: d.receiverUID || null,
                            receiverAddress: d.receiverAddress || null,
                            amount: parseFloat(d.amount),
                            remark: d.remark || null,
                            status: d.status,
                        },
                    });
                }
            }
            break;
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
