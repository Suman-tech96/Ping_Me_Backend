import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true
    }, 
    photo: {
        type: String,
        default: "https://res.cloudinary.com/dzt89p0bm/image/upload/v1713271111/avatar_default.png"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model("User", userSchema);
export default User;
