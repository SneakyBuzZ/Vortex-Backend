import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
    //get details from frontend
    //validation - not empty
    //check if user already exist : username or email
    //check for images , check for avatar
    // if available sent them to cloudinary
    //create user object - create entry in db
    //remove password and refreshtoken filed from reponse
    // check for user creation
    //if yes then return response


    //=========================== GETTING DETAILS ========================================
    const { username, email, password, fullName } = req.body
    // console.log('email : ', email)

    //=========================== VALIDATION ========================================    
    if ([fullName, email, password, username].some((eachItem) => eachItem?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    //=========================== CHECKING IF USER EXISTS ========================================  
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) throw new ApiError(409, "User with email or username already exists");


    //=========================== CHECKING FOR IMAGES AND AVATAR ========================================  
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

    //=========================== SENDING IMAGES AND AVATAR TO CLOUDINARY  ========================================  
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) throw new ApiError(400, "Avatar is required");

    //=========================== CREATING USER OBJECT ========================================  
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    //=========================== REMOVING PASSWORD AND REFRESHTOKEN ========================================  
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //=========================== CHECKING IF USER IS CREATED ========================================      
    if (!createdUser) throw new ApiError(500, "User data failed to be registered");

    console.log("REGISTERED USER : ", createdUser)
    //=========================== RETURNING RESPONSE ========================================      
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

const generateAccessAndFreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const refreshTokenPromise = user.generateRefreshToken()
        const accessTokenPromise = user.generateAccessToken()

        const accessToken = await accessTokenPromise;
        const refreshToken = await refreshTokenPromise;

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { refreshToken, accessToken }
    } catch (error) {
        throw new ApiError(500, "Failed to generate refresh and access tokens")
    }
}

const loginUser = asyncHandler(async (req, res) => {
    //GET DETAILS
    //VERIFY USER WITH USERNAME OR EMAIL
    //FIND USER
    //PASSWORD CHECK USING BCRYPT
    //GENERATE AND GIVE  ACCESS AND REFRESH TOKENS
    //SEND COOKIE

    //==================== GET USER DETAIKS ==========================
    const { username, email, password } = req.body;

    //==================== CHECK EITHER EMAIL OR PASSWORD ==========================
    if (!(username || email)) throw new ApiError(401, "Email or username is required");

    //==================== FIND USER FROM DB ==========================
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) throw new ApiError(400, "User doesnot exist");

    //==================== PASSWORD CHECK ==========================
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) throw new ApiError(403, "Password is incorrect");

    //==================== GENERATE AND GIVE REFRESH AND ACCESS TOKEN ==========================
    const { accessToken, refreshToken } = await generateAccessAndFreshTokens(user._id);


    //==================== NEW USER WITHOUT PASSWORD AND REFRESHTOKEN ==========================
    const logginUser = await User.findById(user._id).select("-password -refreshToken")

    //==================== SEND COOKIES ==========================
    const options = {
        httpOnly: true,
        secure: false
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                201,
                {
                    user: logginUser, accessToken: accessToken, refreshToken: refreshToken
                },
                "User loggedin successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await User.findByIdAndUpdate(
        userId,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: false
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(201, {}, "User is successfully logout")
        )

})

const renewAccessToken = asyncHandler(async (req, res) => {
    const inComingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if (!inComingRefreshToken) throw new ApiError(401, "Unauthorized request")

    try {
        const decodedToken = jwt.verify(inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)
        if (!user) throw new ApiError(405, "Failed to find user with given token")

        console.log("USER ACCESS TOKEN: ", user.refreshToken)

        if (inComingRefreshToken !== user.refreshToken) throw new ApiError(403, "Token expired or used")

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndFreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: false
        }

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken: newAccessToken, refreshToken: newRefreshToken },
                    "Access token is renewed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(400, "Invalid token")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmedNewPassword } = req.body

    const userId = req.user?._id;
    const user = await User.findById(userId).select("-refreshToken")

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) throw new ApiError(405, "Enter correct password")


    if ((oldPassword === newPassword) && (oldPassword === confirmedNewPassword)) throw new ApiError(402, "Same password cannot be updated");
    if (newPassword !== confirmedNewPassword) throw new ApiError(403, "Confirm password was incorrect");


    user.password = confirmedNewPassword;
    const isPasswordSaved = await user.save({ validateBeforeSave: false })

    if (!isPasswordSaved) throw new ApiError(500, "Database couldn't saved new password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    previousPassword: oldPassword,
                    currentPassword: user.password
                },
                "Password was successfully changed"
            )
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "User is fetched successfully"
            )
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!(fullName && email)) throw new ApiError(401, "All fields are required")

    const userId = req.user?._id;

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "User details updated successfully"
            )
        )
})

const updateAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.files?.avatar[0]?.path

    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing")

    const avatar = await uploadOnCloudinary(avatarLocalPath);


    const userId = req.user?._id;

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "avatar updated successfully"
            )
        )
})

const updateCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!coverImageLocalPath) throw new ApiError(400, "Avatar file is missing")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    const userId = req.user?._id;

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "coverImage updated successfully"
            )
        )
})

const getChannelDetails = asyncHandler(async (req, res) => {

    const username = req.params?.username

    if (!username.trim()) throw new ApiError(400, "Username is missing")

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase().trim()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribeToCount: {
                    $size: "$subscribedTo"
                }
            }
        },
        {
            $project: {
                fullName: 1,
                email: 1,
                username: 1,
                coverImage: 1,
                avatar: 1,
                subscribersCount: 1,
                subscribeToCount: 1
            }
        }
    ])

    if (!channel?.length) throw new ApiError(400, "Channel doesnt not exists")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "Channel successfully fetched"
            )
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "owner",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                            ]
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if (!user) throw new ApiError(500, "Failed to fetch watchHistory")



    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})

export { registerUser, loginUser, logoutUser, renewAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getChannelDetails, getWatchHistory }

