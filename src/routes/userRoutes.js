import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { 
    updateProfile, 
    uploadProfilePicture,
    updateProfilePicture,
    deleteProfilePicture, 
    getUserProfile ,
    getUserById,
    findUserByPhone,
    deleteAccount
} from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ storage });

router.get("/profile", verifyToken, getUserProfile);
router.get("/profile/:id", getUserById);
router.get("/phone/:phone", verifyToken, findUserByPhone);

// Profile Updates
router.patch("/update", verifyToken, upload.single("image"), updateProfile);

// Image Management
router.post("/upload-image", verifyToken, upload.single("image"), uploadProfilePicture);
router.patch("/update-image", verifyToken, upload.single("image"), updateProfilePicture);
router.delete("/delete-image", verifyToken, deleteProfilePicture);

router.delete("/delete-account", verifyToken, deleteAccount);
export default router;
