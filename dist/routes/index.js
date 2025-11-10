import order from "./order/index.js";
import refund from "./refund/index.js";
import report from "./report/index.js";
export default function (app) {
    app.use("/order", order);
    app.use("/refund", refund);
    app.use("/report", report);
}
