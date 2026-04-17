import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    message: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "sent"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
