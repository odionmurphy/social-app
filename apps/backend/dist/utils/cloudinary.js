"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.uploadVideo = uploadVideo;
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
async function uploadImage(filePath, folder) {
    const result = await cloudinary_1.v2.uploader.upload(filePath, {
        folder,
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ]
    });
    return result.secure_url;
}
async function uploadVideo(filePath, folder) {
    const result = await cloudinary_1.v2.uploader.upload(filePath, {
        folder,
        resource_type: 'video',
        eager: [{ format: 'mp4', transformation: [{ width: 720, crop: 'limit' }] }],
        eager_async: true,
    });
    return result.secure_url;
}
