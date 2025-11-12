import order from "./order/index.js";
import refund from "./refund/index.js";
import report from "./report/index.js";
import payoutOrder from "./payoutOrder/index.js";
// import onchain from "./onchain/index.js";
export default function (app) {
    app.use("/order", order);
    app.use("/refund", refund);
    app.use("/report", report);
    app.use("/payout/order", payoutOrder);
    // app.use("/onchain", onchain);
}
