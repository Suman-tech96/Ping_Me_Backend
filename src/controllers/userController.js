import User from "../models/User.js";
import Message from "../models/Message.js";
import { cloudinary } from "../config/cloudinary.js";


// ===============================
// HELPER: DELETE OLD IMAGE FROM CLOUDINARY
// ===============================
const deleteOldImage = async (photoUrl) => {
  if (photoUrl && !photoUrl.includes("avatar_default.png")) {
    const publicId = photoUrl.split("/").pop().split(".")[0];
    try {
      await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
    } catch (err) {
      console.error("Old image deletion failed:", err.message);
    }
  }
};


// ===============================
// UPDATE PROFILE (Name & Phone)
// ===============================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    // Also support image if it happens to be sent here
    if (req.file) {
      await deleteOldImage(user.photo);
      updateData.photo = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $set: updateData }, 
        { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// UPLOAD / UPDATE PROFILE PICTURE
// ===============================

export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete old one if exists
    await deleteOldImage(user.photo);

    user.photo = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: "Profile picture updaded successfully",
      photo: user.photo
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Alias for convenience or slightly different logic if needed
export const updateProfilePicture = uploadProfilePicture;

// ===============================
// DELETE PROFILE PICTURE (REVERT TO DEFAULT)
// ===============================
export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    await deleteOldImage(user.photo);

    user.photo = "https://res.cloudinary.com/dzt89p0bm/image/upload/v1713271111/avatar_default.png";
    await user.save();

    res.json({
      success: true,
      message: "Profile picture deleted",
      photo: user.photo
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// GET CURRENT PROFILE
// ===============================
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const findUserByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await User.findOne({ phone }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete profile image from Cloudinary
    await deleteOldImage(user.photo);

    // Delete all messages sent by this user
    await Message.deleteMany({ senderId: userId });

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Account deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};