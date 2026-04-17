// src/server.js

import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/socket/socketHandler.js";

dotenv.config();

// CONNECT DATABASE
connectDB();

// ===============================
// CREATE HTTP SERVER
// ===============================
const server = http.createServer(app);

// ===============================
// SOCKET SETUP
// ===============================
const io = new Server(server, {
  cors: {
    origin: "*", // change in production
    methods: ["GET", "POST"]
  }
});

// ===============================
// ONLINE USERS STORE
// ===============================
const onlineUsers = new Map();

// ===============================
// SOCKET AUTH MIDDLEWARE
// ===============================
// ===============================
// SOCKET AUTH MIDDLEWARE
// ===============================
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.token;

    if (!token) {
      console.log("Socket Auth Failed: No Token");
      return next(); // Still allow connection but without userId if needed, or enforce strict
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.name = decoded.name;
    next();

  } catch (err) {
    console.log("Socket Auth Failed:", err.message);
    next();
  }
});

// ===============================
// INITIALIZE SOCKET LOGIC
// ===============================
initSocket(io);

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});