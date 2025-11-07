import order from "./order/index.js";
import refund from "./refund/index.js";
export default function (app) {
    app.use("/order", order);
    app.use("/refund", refund);
}
