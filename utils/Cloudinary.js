const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'StudyLive', // optional: cloud folder name
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});
const multerUpload = require('multer')({ storage });
module.exports = { cloudinary, multerUpload };
