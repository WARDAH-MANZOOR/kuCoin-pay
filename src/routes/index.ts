import express from "express";


import order from "./order/index.js";
import refund from "./refund/index.js";
import report from "./report/index.js";
import payoutOrder from "./payoutOrder/index.js";
import onchainOrder from "./onchainOrder/index.js";
import onchainRefund from "./onchainRefund/index.js";

export default function (app: express.Application) {
  app.use("/order", order);
  app.use("/refund", refund);
  app.use("/report", report);
  app.use("/payout/order", payoutOrder);
  app.use("/onchain/order", onchainOrder);
  app.use("/onchain/order/refund", onchainRefund);



  
}