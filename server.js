const express = require("express");
require("dotenv").config();

const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const conversationRoutes = require("./src/routes/conversationRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const fileRoutes = require("./src/routes/fileRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

const app = express();
app.use((req, res, next) => {
  const origin = req.headers.origin;

  const allowedOrigins = [
    "http://localhost:3000",
    "https://rajesh-ai-messenger.netlify.app",
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.use((req, res, next) => {
  console.log("----------------------------------------");
  console.log("METHOD :", req.method);
  console.log("ORIGIN :", req.headers.origin);
  console.log("PATH   :", req.path);
  console.log("----------------------------------------");

  next();
});

connectDB();

app.get("/", (req, res) => {
  res.send("AI Messenger Backend is running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is working!",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/conversations", conversationRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/files", fileRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
