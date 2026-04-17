import Message from "../models/Message.js";
import User from "../models/User.js";

export const getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        // Security check: only allow if user is part of the room
        if (!roomId.includes(userId)) {
            return res.status(403).json({ success: false, message: "Unauthorized access to chat history" });
        }

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const messages = await Message.find({ 
            roomId,
            createdAt: { $gte: twentyFourHoursAgo }
        }).sort({ createdAt: 1 });

        res.json({
            success: true,
            messages
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const uploadChatImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image provided" });
        }

        res.json({
            success: true,
            imageUrl: req.file.path
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const alphabetUserId = userId.toString();
        
        // Find messages where room contains our ID
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Get unique room IDs for this user
        const rooms = await Message.distinct("roomId", {
            roomId: { $regex: alphabetUserId },
            createdAt: { $gte: twentyFourHoursAgo }
        });

        // Extract participant IDs (the ones that are NOT us)
        const participantIds = rooms.map(roomId => {
            const parts = roomId.split("_");
            return parts[0] === alphabetUserId ? parts[1] : parts[0];
        }).filter(id => id); // Remove nulls

        // Fetch user details for these participants
        const users = await User.find({ _id: { $in: participantIds } }).select("name photo phone");

        res.json({
            success: true,
            conversations: users
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const clearChat = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        // Security check: only allow if user is part of the room
        if (!roomId.includes(userId)) {
            return res.status(403).json({ success: false, message: "Unauthorized operation" });
        }

        await Message.deleteMany({ roomId });
        res.json({ success: true, message: "Chat cleared successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
