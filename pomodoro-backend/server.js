const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const sessionRoutes = require("./routes/sessions");

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId; // Attach to request for correlation
  
  console.log(`[${timestamp}] [REQ-${requestId}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    // Log request body but hide sensitive data
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[HIDDEN]';
    console.log(`[${timestamp}] [REQ-${requestId}] Request body:`, JSON.stringify(sanitizedBody));
  }
  
  // Log response status for both send and json
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(data) {
    console.log(`[${new Date().toISOString()}] [REQ-${requestId}] ${req.method} ${req.path} - Status: ${res.statusCode}`);
    originalSend.call(this, data);
  };
  
  res.json = function(data) {
    console.log(`[${new Date().toISOString()}] [REQ-${requestId}] ${req.method} ${req.path} - Status: ${res.statusCode}`);
    if (req.path.includes('/sessions') && req.method === 'POST') {
      console.log(`[${new Date().toISOString()}] [REQ-${requestId}] Session response:`, JSON.stringify(data));
    }
    originalJson.call(this, data);
  };
  
  next();
});

// Healthcheck / keep-alive route (use this for Render cron / uptime monitors)
app.get("/api/ping", (_req, res) => {
  console.log(`[PING] Health check requested at ${new Date().toISOString()}`);
  res.status(200).send("hi ping");
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sessions", sessionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
