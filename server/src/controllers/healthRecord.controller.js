import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { HealthRecord } from "../models/healthRecord.model.js";
import { MLState } from "../models/mlState.model.js";
import axios from "axios";
import { healthAnomalyAlertContent, sendEmail } from "../utils/mail.js";
import { User } from "../models/user.model.js";

const getHealthRecordOfUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        if (!userId) {
            throw new ApiError(400, "User hasn't logged in.");
        }

        const recentData = await HealthRecord.getRecentRecords(userId, 30);

        if (recentData.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        {},
                        "User didn't register any data in last 30 days."
                    )
                );
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { recentData },
                    "User's last 30 days data."
                )
            );
    } catch (error) {
        console.error("Error in analyzeUserHealth controller:", error);
        throw new ApiError(500, "Internal server error.");
    }
});

const getStatisticOfUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        if (!userId) {
            throw new ApiError(400, "User hasn't logged in.");
        }

        const statsArray = await HealthRecord.getStatistics(userId, 30);

        if (!statsArray || statsArray.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        {},
                        "No health records found for this period. Cannot generate statistics."
                    )
                );
        }

        const stats = statsArray[0];

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    stats,
                    "Successfully got the statistic of last 30 days."
                )
            );
    } catch (error) {
        console.error("Error fetching health statistics:", error);
        throw new ApiError(500, "Internal server error");
    }
});

const createHealthRecord = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(400, "Unauthorized, user isn't logged in.");
    }

    const { heart_rate, systolic_bp, blood_sugar, steps, water_intake } =
        req.body;

    if (
        heart_rate === undefined ||
        systolic_bp === undefined ||
        blood_sugar === undefined ||
        steps === undefined ||
        water_intake === undefined
    ) {
        throw new ApiError(
            400,
            "Missing required fields. You must provide heart_rate, systolic_bp, blood_sugar, steps, and water_intake."
        );
    }

    const result = await HealthRecord.createRecord(userId, req.body);

    return res
        .status(201)
        .json(new ApiResponse(200, { data: result.record }, result.message));
});

const healthPrediction = asyncHandler(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(400, "Unauthorized, user isn't logged in.");
    }

    const healthRecord = await HealthRecord.findOne({
        userId,
    }).sort({ recordedAt: -1 });

    if (!healthRecord) {
        throw new ApiError(404, "No health records found.");
    }

    const targetApi = process.env.ML_API_URL;

    let payload;

    if (req.user.counter === -1) {
        payload = {
            heart_rate: healthRecord.heart_rate,
            systolic_bp: healthRecord.systolic_bp,
            blood_sugar: healthRecord.blood_sugar,
            steps: healthRecord.steps,
            water_intake: healthRecord.water_intake,
            stream_index: req.user.counter + 1,
            rrcf_state_b64: null,
            zscore_state: null,
        };
    } else {
        const mlState = await MLState.findOne({ userId });

        if (!mlState)
            throw new ApiError(404, "ML State not found for this user");

        payload = {
            heart_rate: healthRecord.heart_rate,
            systolic_bp: healthRecord.systolic_bp,
            blood_sugar: healthRecord.blood_sugar,
            steps: healthRecord.steps,
            water_intake: healthRecord.water_intake,
            stream_index: req.user.counter + 1,
            rrcf_state_b64: mlState.rrcf_state_b64,
            zscore_state: mlState.zscore_state,
        };
    }

    try {
        const predictionResponse = await axios.post(targetApi, payload, {
            headers: { "Content-Type": "application/json" },
        });

        if (!predictionResponse.data) {
            throw new ApiError(500, "Internal server error");
        }

        const prediction = predictionResponse.data?.trigger_alert;

        if (typeof prediction !== "boolean") {
            throw new ApiError(500, "Invalid ML response format");
        }

        if (prediction === true) {
            try {
                await sendEmail({
                    email: req.user?.email,
                    subject: "Health alert",
                    mailgenContent: healthAnomalyAlertContent(
                        req.user?.username,
                        "https://www.google.com/"
                    ),
                });
            } catch (error) {
                console.log(error);

                throw new ApiError(500, "unable to send email");
            }
        }

        try {
            await MLState.findOneAndUpdate(
                { userId },
                {
                    rrcf_state_b64:
                        predictionResponse.data?.updated_rrcf_state_b64,
                    zscore_state: predictionResponse.data?.updated_zscore_state,
                },
                { upsert: true }
            );
        } catch (error) {
            console.log(error);
            throw new ApiError(500, "Unable to update MLState doc");
        }

        try {
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { counter: 1 },
            });
        } catch (error) {
            console.log(error);
            throw new ApiError(500, "Unable to update user counter doc");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200,{prediction}, "Successfully predicted")
            )
    } catch (error) {
        if (error instanceof ApiError) throw error;

        console.error(
            "prediction error →",
            JSON.stringify(error.response?.data || error.message, null, 2)
        );

        throw new ApiError(500, "Unable to get prediction");
    }
});

export {
    getHealthRecordOfUser,
    getStatisticOfUser,
    createHealthRecord,
    healthPrediction,
};
