import express from "express";
import multer from "multer";
import { chatStorage } from "../config/cloudinary.js";
import { getChatHistory, uploadChatImage, getConversations, clearChat } from "../controllers/chatController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: chatStorage });

router.get("/history/:roomId", verifyToken, getChatHistory);
router.get("/conversations", verifyToken, getConversations);
router.post("/upload-image", verifyToken, upload.single("image"), uploadChatImage);
router.delete("/clear/:roomId", verifyToken, clearChat);

export default router;
