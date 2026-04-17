import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { generateToken } from "../utils/generateToken.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import bcrypt from "bcrypt";

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      phone: phone || "",
      password: hashedPassword,
    });

    res.json({
      success: true,
      message: "User registered successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// LOGIN
// ===============================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 COMPARE PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo, // Added photo field
    };

    const token = generateToken(userData);

    res.json({
      success: true,
      message: "Login successful",
      user: userData,
      token, // Profile access token
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ===============================
// SEND OTP
// ===============================

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    await OTP.findOneAndUpdate(
      { email },
      { 
        otp, 
        expiresAt: Date.now() + 5 * 60 * 1000 
      },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp);

    res.json({ success: true, message: "OTP sent" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ===============================
// VERIFY OTP
// ===============================
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpDoc = await OTP.findOne({ email });

    if (!otpDoc) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (Date.now() > otpDoc.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (otpDoc.otp != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// RESET PASSWORD
// ===============================
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await OTP.deleteOne({ email });

    res.json({
      success: true,
      message: "Password updated"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
  