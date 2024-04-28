import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { deleteVideo, getAllVideos, getOwnerVideos, getVideoById, togglePublishStatus, updateVideo, uploadVideo } from "../controllers/video.controller.js";

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

videoRouter.route("/vid/:videoId").get(getVideoById).put(
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
).delete(deleteVideo).patch(togglePublishStatus)

videoRouter.route("/").get(getAllVideos)

videoRouter.route("/owner").get(getOwnerVideos)

export default videoRouter