import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { getAllVideos, getVideoById, updateVideo, uploadVideo } from "../controllers/video.controller.js";

const videoRouter = Router();

videoRouter.use(verifyJwt)

videoRouter.route("/upload-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    uploadVideo
)

videoRouter.route("/vid/:videoId").get(getVideoById).post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    updateVideo
)

videoRouter.route("/all-videos").get(getAllVideos)

export default videoRouter