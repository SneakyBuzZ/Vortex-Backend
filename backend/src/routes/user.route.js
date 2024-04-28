import { Router } from "express"
import { changePassword, getChannelDetails, getCurrentUser, getWatchHistory, loginUser, logoutUser, registerUser, renewAccessToken, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js"

const userRouter = Router();

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

userRouter.route("/login").post(loginUser)



//=============== SECURED ROUTES ===================
userRouter.route("/logout").post(verifyJwt, logoutUser)

userRouter.route("/refresh-token").post(renewAccessToken)

userRouter.route("/change-password").post(verifyJwt, changePassword)

userRouter.route("/current-user").get(verifyJwt, getCurrentUser)

userRouter.route("/update-account").patch(verifyJwt, updateAccountDetails)

userRouter.route("/update-avatar").patch(
    verifyJwt,
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    updateAvatar
)

userRouter.route("/update-cover").patch(
    verifyJwt,
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    updateCoverImage
)

userRouter.route("/ch/:username").get(verifyJwt, getChannelDetails)


userRouter.route("/watch-history").get(verifyJwt, getWatchHistory)

export default userRouter