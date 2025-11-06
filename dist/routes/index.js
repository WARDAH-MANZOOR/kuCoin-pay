import order from "./order/index.js";
export default function (app) {
    app.use("/order", order);
}
