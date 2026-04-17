// src/socket/socketHandler.js
import Message from "../models/Message.js";
import User from "../models/User.js";
import NotificationLog from "../models/NotificationLog.js";
import { sendNotificationEmail } from "../utils/sendEmail.js";

export const initSocket = (io) => {

  // store online users
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // ===============================
    // REGISTER USER
    // ===============================
    socket.on("registerUser", ({ userId, name }) => {
      socket.userId = userId;
      socket.name = name;

      onlineUsers.set(userId, socket.id);

      console.log("🟢 Online Users:", onlineUsers.size);
    });

    // ===============================
    // JOIN ROOM (Enforced One-to-One)
    // ===============================
    socket.on("joinRoom", ({ roomId }) => {
      if (!socket.userId) return;
      
      // Ensure the room ID actually contains the user's ID
      // Rooms are formatted as "ID1_ID2" where ID1 < ID2 alphabetically
      if (roomId.includes(socket.userId)) {
        socket.join(roomId);
        console.log(`📥 Private Room: ${socket.name} joined ${roomId}`);
      } else {
        console.warn(`🛑 Unauthorized room join attempt by ${socket.userId} to ${roomId}`);
      }
    });

    // ===============================
    // SEND MESSAGE (One-to-One)
    // ===============================
    socket.on("sendMessage", async ({ roomId, message, image, recipientId }) => {
      try {
        if (!socket.userId || !recipientId) {
          console.error("❌ SendMessage Failed: Missing sender or recipient");
          return;
        }

        // Securely determine the correct roomId on server
        const expectedRoomId = [socket.userId, recipientId].sort().join("_");
        
        // If the client provided a different roomId, use the expected one to prevent data conflict
        const finalRoomId = expectedRoomId;

        const status = onlineUsers.has(recipientId) ? "delivered" : "sent";

        const newMessage = await Message.create({
          roomId: finalRoomId,
          senderId: socket.userId,
          name: socket.name || "Unknown",
          message: message || null,
          image: image || null,
          status
        });

        // Broadcast ONLY to the specific one-to-one room
        io.to(finalRoomId).emit("receiveMessage", newMessage);
        console.log(`✅ Private Msg: ${socket.userId} -> ${recipientId} in ${finalRoomId}`);

        // Handle offline notifications (existing logic)
        if (!onlineUsers.has(recipientId)) {
          const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
          const log = await NotificationLog.findOne({ recipientId });

          if (!log || log.lastNotifiedAt < eightHoursAgo) {
            const recipient = await User.findById(recipientId);
            if (recipient && recipient.email) {
              await sendNotificationEmail(recipient.email, socket.name || "Someone");
              if (log) {
                log.lastNotifiedAt = new Date();
                await log.save();
              } else {
                await NotificationLog.create({ recipientId, lastNotifiedAt: new Date() });
              }
            }
          }
        }
      } catch (err) {
        console.error("❌ Error in sendMessage:", err.message);
      }
    });

    // ===============================
    // UNSEND MESSAGE
    // ===============================
    socket.on("deleteMessage", async ({ roomId, messageId }) => {
      try {
        await Message.findByIdAndDelete(messageId);
        io.to(roomId).emit("messageDeleted", { messageId });
      } catch (err) {
        console.error("Error unsending message:", err.message);
      }
    });

    // ===============================
    // TYPING
    // ===============================
    socket.on("typing", ({ roomId }) => {
      socket.to(roomId).emit("userTyping", {
        userId: socket.userId,
        name: socket.name
      });
    });

    socket.on("stopTyping", ({ roomId }) => {
      socket.to(roomId).emit("userStopTyping", {
        userId: socket.userId
      });
    });

    // ===============================
    // MARK AS SEEN
    // ===============================
    socket.on("markSeen", async ({ roomId }) => {
      try {
        await Message.updateMany(
          { roomId, senderId: { $ne: socket.userId }, status: { $ne: "seen" } },
          { $set: { status: "seen" } }
        );
        io.to(roomId).emit("messagesSeen", { roomId });
      } catch (err) {
        console.error("❌ Error marking messages as seen:", err.message);
      }
    });

    // ===============================
    // WEBRTC CALLING (SIGNALING)
    // ===============================
    socket.on("callUser", ({ userToCall, signalData, from, name, callType }) => {
      const recipientSocketId = onlineUsers.get(userToCall);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("incomingCall", { signal: signalData, from, name, callType });
        console.log(`📞 Call signal from ${name} to ${userToCall}`);
      } else {
        socket.emit("callFailed", { message: "User is offline" });
      }
    });

    socket.on("answerCall", (data) => {
      const recipientSocketId = onlineUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("callAccepted", data.signal);
      }
    });

    socket.on("ice-candidate", (data) => {
      const recipientSocketId = onlineUsers.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("ice-candidate", data.candidate);
      }
    });

    socket.on("callRejected", ({ to }) => {
      const recipientSocketId = onlineUsers.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("callRejected");
      }
    });

    socket.on("endCall", ({ to }) => {
      const recipientSocketId = onlineUsers.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("endCall");
      }
    });

    // ===============================
    // DISCONNECT
    // ===============================
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);

      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
    });

  });
};