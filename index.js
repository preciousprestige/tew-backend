const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { webhookQueue } = require("../workers/webhookWorker");
const { ordersQueue } = require("../workers/ordersWorker");
const { paymentsQueue } = require("../workers/paymentsWorker");
const { protect } = require("./middleware/auth");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const paystackRoutes = require("./routes/paystack.routes");
const webhookRoutes = require("./routes/webhook.routes");
const { notFound, errorHandler } = require("./middleware/error");

dotenv.config();
const app = express();

// ✅ JSON parser
app.use(express.json());

// ✅ Bull Board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(webhookQueue),
    new BullMQAdapter(ordersQueue),
    new BullMQAdapter(paymentsQueue),
  ],
  serverAdapter,
});

// ✅ Protect Bull Board with JWT
app.use("/admin/queues", protect, serverAdapter.getRouter());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/webhook", webhookRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// ✅ DB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.error("DB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
