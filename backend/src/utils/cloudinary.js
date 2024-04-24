import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        //uploading file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        if (!response) console.log("UTILS | CLOUDINARY | FAILED TO UPLOAD FILE ")

        // console.log("File is uploaded on cloudinary")
        fs.unlinkSync(localFilePath)

        return response;

    } catch (error) {

        //removing non uploaded files from local server
        fs.unlinkSync(localFilePath)
    }
}

export { uploadOnCloudinary }
