import express from "express";


import order from "./order/index.js";

export default function (app: express.Application) {
  app.use("/order", order);
  
}