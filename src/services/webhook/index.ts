import axios from "axios";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sign } from "../../utils/signature.js";
import { decryptAES } from "../../utils/aesDecrypt.js";
const prisma = new PrismaClient();
const AES_KEY = process.env.AES_SECRET_KEY;

async function handleKucoinWebhookEvent(body: any) {
  let decryptedPayerDetail: string | null = null;

  if (body.payerDetail && AES_KEY) {
    try {
      decryptedPayerDetail = decryptAES(body.payerDetail, AES_KEY);
      console.log("🔓 Decrypted payerDetail:", decryptedPayerDetail);
    } catch (err) {
      if (err instanceof Error) {
        console.error("❌ AES decrypt failed:", err.message);
      } else {
        console.error("❌ AES decrypt failed:", String(err));
      }
    }
  }
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
          // payerDetail: body.payerDetail || null,
          payerDetail: decryptedPayerDetail || null,

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

          remainingRefundAmount:
            body.remainingRefundAmount !== undefined
              ? parseFloat(body.remainingRefundAmount)
              : undefined,

          remainingRefundCurrency: body.remainingRefundCurrency || null,

          // TIMESTAMPS
          refundFinishTime: body.refundFinishTime
            ? BigInt(body.refundFinishTime)
            : undefined,

          // ADVANCED OPTIONAL FIELDS
          payerUserId: body.payerUserId || null,
          retrieveKycStatus:
            body.retrieveKycStatus !== undefined
              ? body.retrieveKycStatus
              : undefined,
          // payerDetail: body.payerDetail || null,
          payerDetail: decryptedPayerDetail || null,

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
    // case "ONCHAIN_PAYMENT":
    //   await prisma.onchainOrder.updateMany({
    //     where: { requestId: body.requestId },
    //     data: {
    //       subMerchantId: body.subMerchantId || null,
    //       status: body.status,
    //       chain: body.chain,
    //       cryptoCurrency: body.currency,
    //       cryptoAmount: parseFloat(body.paymentAmount),
    //       reference: body.reference || null,
    //       kucoinOrderId: body.payOrderId,
    //     },
    //   });
    //   break;
    case "ONCHAIN_PAYMENT": {
      console.log("🔔 ONCHAIN PAYMENT WEBHOOK RECEIVED:", body);

      await prisma.onchainOrder.updateMany({
        where: { requestId: body.requestId },
        data: {
          // IDENTIFIERS
          orderType: body.orderType,                 // always ONCHAIN_PAYMENT
          subMerchantId: body.subMerchantId || null,
          kucoinOrderId: body.payOrderId,

          // STATUS
          status: body.status,                       // CREATED / USER_PAY_COMPLETED / etc.
          paymentOrderType: body.paymentOrderType,   // ACTIVE / PASSIVE
          paymentStatus: body.paymentStatus,         // FULL_PAYMENT / PART_PAYMENT etc.

          // PAYMENT DETAILS
          chain: body.chain,                         // chain of transaction (eth / btc)
          cryptoCurrency: body.currency,             // crypto currency (USDT etc)
          cryptoAmount:
            body.paymentAmount !== undefined
              ? parseFloat(body.paymentAmount)
              : undefined,                           // actual payment amount

          paymentCurrency: body.paymentCurrency || null,
          paymentAmount:
            body.paymentAmount !== undefined
              ? parseFloat(body.paymentAmount)
              : undefined,

          paymentChain: body.chain || null,          // same as chain

          assetUniqueId: body.assetUniqueId || null, // tx hash

          // OPTIONAL
          reference: body.reference || null,
        },
      });

      console.log("💾 Onchain payment webhook saved.");
      break;
    }


    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      4.5 ONCHAIN REFUND WEBHOOK
      (mapped to Refund table)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    // case "ONCHAIN_REFUND":
    //   await prisma.refund.updateMany({
    //     where: { kucoinRefundId: body.refundId },
    //     data: {
    //       status: body.status,
    //       refundAmount: parseFloat(body.refundAmount),
    //       refundReason: body.refundReason || null,
    //     },
    //   });
    //   break;
    case "ONCHAIN_REFUND":
      await prisma.refund.updateMany({
        where: { kucoinRefundId: body.refundId },
        data: {
          refundRequestId: body.requestId,
          payID: body.payOrderId,

          refundAmount: body.refundAmount ? parseFloat(body.refundAmount) : undefined,
          refundCurrency: body.refundCurrency || null,

          remainingRefundAmount: body.remainingRefundAmount
            ? parseFloat(body.remainingRefundAmount)
            : undefined,

          remainingRefundCurrency: body.remainingRefundCurrency || null,

          status: body.status,
          subMerchantId: body.subMerchantId || null,
          chain: body.chain || null,
          feeAmount: body.feeAmount ? parseFloat(body.feeAmount) : null,
          assetUniqueId: body.assetUniqueId || null,

          reference: body.reference || null,
          refundReason: body.refundReason || null,
          address: body.address || null,   // ⭐ NEW
        },
      });
      break;


    default:
      console.warn("⚠️ Unknown webhook event:", body.orderType);
  }
}



export default{
    
    handleKucoinWebhookEvent
}