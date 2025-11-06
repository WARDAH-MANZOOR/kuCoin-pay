import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// 🔹 Middleware to parse JSON
app.use(express.json());
// 🔹 Health check
app.get("/", (req, res) => {
    res.send("🚀 KuCoin Pay Integration Server is running...");
});
// 🔹 Import all routes
routes(app);
// 🔹 Global error handler (optional)
app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
});
// 🔹 Start server
app.listen(PORT, () => {
    console.log(`✅ Server started on http://localhost:${PORT}`);
});
