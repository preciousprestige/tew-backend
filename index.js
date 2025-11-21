const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
const app = express();
const server = http.createServer(app);

// === SOCKET.IO WITH FIXED CORS ===
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "https://tew-eight.vercel.app",
      "https://preciousprestige.github.io",
      "https://preciousprestige.github.io/tew",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// === Middleware ===
// MUST BE FIRST
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// === CORS FOR API REQUESTS ===
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "https://tew-eight.vercel.app",
      "https://preciousprestige.github.io",
      "https://preciousprestige.github.io/tew",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// === MongoDB Connection ===
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// === Import Routes ===
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/products.routes");
const orderRoutes = require("./routes/orders.routes");
const userRoutes = require("./routes/user.routes");
const paystackRoutes = require("./routes/paystack.routes");
const webhookRoutes = require("./routes/webhook.routes");
const adminRoutes = require("./routes/admin.routes");
const uploadRoutes = require("./routes/uploadRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const messageRoutes = require("./routes/message.routes");

// === API Routes ===
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/messages", messageRoutes);

// Handle invalid API routes
app.all(/^\/api(\/.*)?$/, (req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("🚀 TEW backend is running successfully on Render");
});

// === JSON Parse Error Handler (MUST BE AFTER ROUTES)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in req) {
    console.error("❌ Bad JSON:", err);
    return res
      .status(400)
      .json({ success: false, message: "Invalid JSON payload" });
  }
  next(err);
});

// === Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error caught by middleware:", err);
  if (res.headersSent) return next(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// === SOCKET.IO IMPLEMENTATION ===
const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("registerUser", (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`✅ ${userId} registered with socket ${socket.id}`);
  });

  socket.on("sendMessage", (data) => {
    console.log("📩 Message received:", data);

    const receiverSocket = activeUsers.get(data.receiver);
    if (receiverSocket) {
      io.to(receiverSocket).emit("newMessage", data);
    }

    if (data.sender.startsWith("user-")) {
      const adminSocket = activeUsers.get("admin");
      if (adminSocket) {
        io.to(adminSocket).emit("newMessage", data);
      }
    }
  });

  socket.on("disconnect", () => {
    for (let [user, id] of activeUsers.entries()) {
      if (id === socket.id) activeUsers.delete(user);
    }
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running with Socket.IO on http://localhost:${PORT}`)
);
