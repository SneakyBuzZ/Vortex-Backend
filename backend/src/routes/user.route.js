import { Router } from "express"
import { changePassword, getCurrentUser, loginUser, logoutUser, registerUser, renewAccessToken, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controller.js";
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

userRouter.route("/get-user").post(verifyJwt, getCurrentUser)

userRouter.route("/update-account").post(verifyJwt, updateAccountDetails)

userRouter.route("/update-avatar").post(
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
    verifyJwt,
    updateAvatar
)

userRouter.route("/update-cover").post(
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
    verifyJwt,
    updateCoverImage
)


export default userRouter