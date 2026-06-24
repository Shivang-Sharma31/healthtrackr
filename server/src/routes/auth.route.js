import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, resendEmailVerification, verifyEmail } from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
    ]),
    registerUser
);
router.route("/login" ).post( loginUser)
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router
    .route("/resend-email-verification")
    .get(resendEmailVerification);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);


export default router