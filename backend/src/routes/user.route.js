import { Router } from "express"
import { changePassword, loginUser, logoutUser, registerUser, renewAccessToken } from "../controllers/user.controller.js";
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

userRouter.route("/change-password").post(verifyJwt, changePassword)

export default userRouter