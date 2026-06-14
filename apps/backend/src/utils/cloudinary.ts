import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(filePath: string, folder: string) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' }
    ]
  })
  return result.secure_url
}

export async function uploadVideo(filePath: string, folder: string) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'video',
    eager: [{ format: 'mp4', transformation: [{ width: 720, crop: 'limit' }] }],
    eager_async: true,
  })
  return result.secure_url
}
