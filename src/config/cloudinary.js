import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const chatStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chat_images",
    allowed_formats: ["jpg", "png", "jpeg", "gif"],
    transformation: [{ width: 1000, crop: "limit" }],
  },
});

export { cloudinary, storage, chatStorage };
