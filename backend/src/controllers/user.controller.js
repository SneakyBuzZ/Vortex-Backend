import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
        coverImageLocalPath = req.files.coverImageLocalPath[0].path;
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

    //=========================== RETURNING RESPONSE ========================================      
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

export { registerUser }

