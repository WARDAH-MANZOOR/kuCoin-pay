// // import axios from "axios";
// // import fs from "fs";
// // import path from "path";
// // import { Request, Response } from "express";
// // import { PrismaClient } from "@prisma/client";
// // import { sign } from "../../utils/signature.js";

// // const prisma = new PrismaClient();


// // async function handleKucoinWebhookEvent(body: any) {
// //   switch (body.orderType) {

// //     /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// //       4.1 TRADE (NORMAL ORDER PAYMENT) WEBHOOK
// //       Fields:
// //       requestId, payOrderId, status, orderCurrency,
// //       orderAmount, goods[], reference, subMerchantId,
// //       payTime, canRefundAmount, refundCurrency,
// //       errorReason, orderType="TRADE"
// //     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
// //     case "TRADE":
// //       await prisma.order.updateMany({
// //         where: { payOrderId: body.payOrderId },
// //         data: {
// //           status: body.status,
// //           payTime: body.payTime ? new Date(body.payTime) : null,
// //           canRefundAmount: body.canRefundAmount || null,
// //           refundCurrency: body.refundCurrency || null,
// //           errorReason: body.errorReason || null,
// //           reference: body.reference || null,
// //           updatedAt: new Date(),
// //         },
// //       });
// //       break;

// //     /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// //       4.2 REFUND NOTIFICATION
// //       (orderType = REFUND)
// //       Fields:
// //       merchantId, subMerchantId, requestId, refundId,
// //       payID, refundAmount, remainingRefundAmount,
// //       status (only SUCCEEDED sent), refundFinishTime,
// //       refundCurrency, remainingRefundCurrency, reference,
// //       refundReason
// //     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
// //     case "REFUND":
// //       await prisma.refund.updateMany({
// //         where: { kucoinRefundId: body.refundId },
// //         data: {
// //           status: body.status,
// //           refundAmount: parseFloat(body.refundAmount || 0),
// //           remainingRefundAmount: parseFloat(
// //             body.remainingRefundAmount || 0
// //           ),
// //           refundCurrency: body.refundCurrency,
// //           refundReason: body.refundReason || null,
// //           refundFinishTime: body.refundFinishTime
// //             ? new Date(body.refundFinishTime)
// //             : null,
// //           updatedAt: new Date(),
// //         },
// //       });
// //       break;

// //     /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// //       4.3 PAYOUT NOTIFICATION
// //       Fields:
// //       orderType="PAYOUT", batchNo, batchName, currency,
// //       payoutType, processingFee, requestId, status,
// //       totalAmount, totalCount, totalPaidAmount, totalPayoutFee,
// //       withdrawDetailDtoList[]
// //     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
// //     case "PAYOUT":
// //       await prisma.payoutBatch.upsert({
// //         where: { batchNo: body.batchNo },
// //         update: {
// //           status: body.status,
// //           payoutType: body.payoutType,
// //           totalAmount: body.totalAmount,
// //           totalCount: body.totalCount,
// //           totalPaidAmount: body.totalPaidAmount,
// //           totalPayoutFee: body.totalPayoutFee,
// //           processingFee: body.processingFee,
// //           updatedAt: new Date(),
// //         },
// //         create: {
// //           batchNo: body.batchNo,
// //           batchName: body.batchName,
// //           status: body.status,
// //           payoutType: body.payoutType,
// //           currency: body.currency,
// //           requestId: body.requestId,
// //           totalAmount: body.totalAmount,
// //           totalCount: body.totalCount,
// //           totalPaidAmount: body.totalPaidAmount,
// //           totalPayoutFee: body.totalPayoutFee,
// //           processingFee: body.processingFee,
// //         },
// //       });

// //       // Save payout details
// //       if (Array.isArray(body.withdrawDetailDtoList)) {
// //         for (const d of body.withdrawDetailDtoList) {
// //           await prisma.payoutDetail.upsert({
// //             where: { detailId: d.detailId },
// //             update: {
// //               status: d.status,
// //               amount: d.amount,
// //               receiverAddress: d.receiverAddress,
// //               receiverUID: d.receiverUID,
// //               remark: d.remark,
// //             },
// //             create: {
// //               detailId: d.detailId,
// //               batchNo: body.batchNo,
// //               status: d.status,
// //               amount: d.amount,
// //               receiverAddress: d.receiverAddress,
// //               receiverUID: d.receiverUID,
// //               remark: d.remark,
// //             },
// //           });
// //         }
// //       }
// //       break;

// //     /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// //       4.4 ONCHAIN PAYMENT NOTIFICATION
// //       Fields:
// //       orderType="ONCHAIN_PAYMENT"
// //       requestId, payOrderId, chain, currency,
// //       paymentAmount, paymentCurrency, assetUniqueId,
// //       status, paymentStatus, paymentOrderType,
// //       subMerchantId
// //     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
// //     case "ONCHAIN_PAYMENT":
// //       await prisma.onchainOrder.updateMany({
// //         where: { payOrderId: body.payOrderId },
// //         data: {
// //           chain: body.chain,
// //           currency: body.currency,
// //           status: body.status,
// //           paymentStatus: body.paymentStatus,
// //           paymentAmount: body.paymentAmount,
// //           paymentCurrency: body.paymentCurrency,
// //           assetUniqueId: body.assetUniqueId,
// //           updatedAt: new Date(),
// //         },
// //       });
// //       break;

// //     /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// //       4.5 ONCHAIN REFUND NOTIFICATION
// //       Fields:
// //       orderType="ONCHAIN_REFUND"
// //       refundId, requestId, payOrderId, refundAmount,
// //       refundCurrency, remainingRefundAmount,
// //       remainingRefundCurrency, chain, feeAmount,
// //       assetUniqueId, reference, refundReason
// //     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
// //     case "ONCHAIN_REFUND":
// //       await prisma.onchainRefund.updateMany({
// //         where: { refundId: body.refundId },
// //         data: {
// //           status: body.status,
// //           refundAmount: body.refundAmount,
// //           refundCurrency: body.refundCurrency,
// //           remainingRefundAmount: body.remainingRefundAmount,
// //           remainingRefundCurrency: body.remainingRefundCurrency,
// //           chain: body.chain,
// //           feeAmount: body.feeAmount,
// //           assetUniqueId: body.assetUniqueId,
// //           reference: body.reference,
// //           refundReason: body.refundReason,
// //           updatedAt: new Date(),
// //         },
// //       });
// //       break;

// //     default:
// //       console.warn("⚠️ Unknown webhook event type:", body.orderType);
// //   }
// // }


// export default{
    
//     handleKucoinWebhookEvent
// }