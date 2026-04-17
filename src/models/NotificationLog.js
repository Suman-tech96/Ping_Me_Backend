import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    lastNotifiedAt: {
        type: Date,
        default: Date.now
    }
});

const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);
export default NotificationLog;
