import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    if (!(title && description)) throw new ApiError(401, "All fields are required")

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    if (!videoFileLocalPath) throw new ApiError(402, "Video file is required")

    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path
    }

    console.log("VIDEOFILE : ", videoFileLocalPath)
    console.log("THUMBNAIL : ", thumbnailLocalPath)

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) throw new ApiError(500, "Couldnt upload file to cloudinary")

    const userId = req.user?._id
    const user = await User.findById(userId).select("-password -refreshToken -coverImage -watchHistory -coverImage")

    if (!user) throw new ApiError(400, "User does not exist")

    const video = await Video.create({
        title,
        description,
        owner: user,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
    })

    const uploadedVideo = await Video.findById(video._id)

    if (!uploadedVideo) throw new ApiError(500, "Failed to upload video")

    return res.status(201).json(
        new ApiResponse(200, uploadedVideo, "Video uploaded successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(400, "Video does not exist")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched successfully"
            )
        )
})

const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    const { title, description } = req.body

    if (!(title && description)) throw new ApiError(400, "all fields are required")

    const newVideoFileLocalPath = req.files?.videoFile[0].path
    if (!newVideoFileLocalPath) throw new ApiError(400, "Video is required")

    let newThumbnailLocaLPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        newThumbnailLocaLPath = req.files.thumbnail[0].path
    }

    console.log("VIDEO AND FILE PATH: ", newVideoFileLocalPath, " ", newThumbnailLocaLPath)

    const newVideoFile = await uploadOnCloudinary(newVideoFileLocalPath)
    const newThumbnail = await uploadOnCloudinary(newThumbnailLocaLPath)

    if (!newVideoFile) throw new ApiError(500, "Failed to update video in cloudinary")

    const newVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                videoFile: newVideoFile.url,
                thumbnail: newThumbnail.url
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newVideo,
                "Video update successfully"
            )
        )
})

const getAllVideos = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "all videos are fetched"
            )
        )
})

export { getAllVideos, uploadVideo, getVideoById, updateVideo }        