import express from "express";


import order from "./order/index.js";
import refund from "./refund/index.js";
import report from "./report/index.js";

export default function (app: express.Application) {
  app.use("/order", order);
  app.use("/refund", refund);
  app.use("/report", report);

  
}