import { Router } from "express";
import {createHealthRecord,getHealthRecordOfUser,getStatisticOfUser, healthPrediction} from "../controllers/healthRecord.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//secured routes

router.route("/create-health-record").post(verifyJWT,createHealthRecord)
router.route("/user-records").get(verifyJWT,getHealthRecordOfUser)
router.route("/user-stats").get(verifyJWT,getStatisticOfUser)
router.route("/predict-health").get(verifyJWT,healthPrediction)



export default router;