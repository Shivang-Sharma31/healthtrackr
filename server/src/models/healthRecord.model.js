import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const healthRecordSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        heart_rate: {
            type: Number,
            required: true,
            min: [0, "Heart rate cannot be negative"],
            max: [300, "Heart rate seems unrealistic"],
        },
        systolic_bp: {
            type: Number,
            required: true,
            min: [0, "Systolic BP cannot be negative"],
            max: [300, "Systolic BP seems unrealistic"],
        },
        blood_sugar: {
            type: Number,
            required: true,
            min: [0, "Blood sugar cannot be negative"],
            max: [600, "Blood sugar seems unrealistic"],
        },
        steps: {
            type: Number,
            default: 0,
            min: [0, "Steps cannot be negative"],
            max: [100000, "Steps seems unrealistic"],
        },
        water_intake: {
            type: Number,
            default: 0,
            min: [0, "Water intake cannot be negative"],
            max: [10, "Water intake seems unrealistic (in litre)"],
        },
        dateString: {
            type: String, // Format: "2026-06-25"
            required: true,
            index: true,
        },
        recordedAt: {
            type: Date,
            default: Date.now,
            required: true,
            // TTL Index: Automatically delete documents 30 days (2592000 seconds) after recordedAt
            index: { expires: "30d" },
        },
    },
    {
        timestamps: false,
    }
);

// Compound index for efficient queries: userId + recordedAt
// This helps with queries like "get all records for user X in last N days"
healthRecordSchema.index({ userId: 1, recordedAt: -1 });

healthRecordSchema.pre("save", function () {
    // Ensure recordedAt is set (in case it's manually overridden)
    if (!this.recordedAt) {
        this.recordedAt = new Date();
    }
});

healthRecordSchema.statics.createRecord = async function (userId, healthData) {
    try {
        // ========== STEP 1: Extract and validate recordedAt ==========
        let recordedAt = healthData.recordedAt
            ? new Date(healthData.recordedAt)
            : new Date();

        // Check if date is valid
        if (isNaN(recordedAt.getTime())) {
            throw new ApiError(
                400,
                "Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)"
            );
        }

        // ========== STEP 2: Prevent future dates ==========
        const now = new Date();
        if (recordedAt > now) {
            throw new ApiError(400, "Cannot log health data for future dates");
        }

        // ========== STEP 3: Prevent logging data older than 30 days ==========
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (recordedAt < thirtyDaysAgo) {
            throw new ApiError(
                400,
                `Cannot log data older than 30 days. Oldest allowed date: ${thirtyDaysAgo.toISOString()}`
            );
        }

        // ========== STEP 4: Extract date string (YYYY-MM-DD) ==========
        // This is the KEY PART for "one per day"
        // We extract just the date part, ignoring the time

        const year = recordedAt.getFullYear();
        const month = String(recordedAt.getMonth() + 1).padStart(2, "0");
        const date = String(recordedAt.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${date}`; // e.g., "2026-06-25"

        // ========== STEP 5: Check if record already exists for this DATE ==========
        // Query: find record with same userId and same dateString
        const existingRecord = await this.findOne({
            userId,
            dateString,
        });

        // If found, reject with friendly error
        if (existingRecord) {
            const dateObj = new Date(recordedAt);
            const formattedDate = dateObj.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }); // e.g., "Thursday, June 25, 2026"

            throw new ApiError(
                400,
                `You've already logged your health data for ${formattedDate}. You can only log once per day. Your previous record was at ${existingRecord.recordedAt.toLocaleTimeString()}.`
            );
        }

        // ========== STEP 6: CREATE NEW RECORD ==========
        const record = new this({
            userId,
            heart_rate: healthData.heart_rate,
            systolic_bp: healthData.systolic_bp,
            blood_sugar: healthData.blood_sugar,
            steps: healthData.steps || 0,
            water_intake: healthData.water_intake || 0,
            recordedAt,
            dateString, // Store the date string for future queries
        });

        await record.save();

        // ========== STEP 7: Generate user-friendly success message ==========
        const todayString = new Date().toISOString().split("T")[0];
        const isToday = dateString === todayString;

        const message = isToday
            ? "✅ Your health data has been logged for today"
            : `✅ Your health data has been logged for ${recordedAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;

        return {
            success: true,
            message,
            record,
        };
    } catch (error) {
        // Re-throw ApiError if it's already an ApiError
        if (error.statusCode) {
            throw error;
        }

        // Handle unique index violations (if using optional unique index)
        if (error.code === 11000) {
            throw new ApiError(
                400,
                "You have already logged your health data for this date. You can only log once per day."
            );
        }

        // Wrap other errors
        throw new ApiError(
            400,
            `Failed to create health record: ${error.message}`
        );
    }
};

healthRecordSchema.statics.findByIdAndUpdate = function () {
    throw new ApiError(
        403,
        "Health records cannot be updated. Create a new record instead if you need to log different data."
    );
};

healthRecordSchema.statics.updateOne = function () {
    throw new ApiError(
        403,
        "Health records cannot be updated. Create a new record instead if you need to log different data."
    );
};

healthRecordSchema.statics.updateMany = function () {
    throw new ApiError(
        403,
        "Health records cannot be updated. Create a new record instead if you need to log different data."
    );
};

healthRecordSchema.statics.getRecentRecords = async function (
    userId,
    days = 30
) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await this.find({
        userId,
        recordedAt: { $gte: cutoffDate },
    }).sort({ recordedAt: -1 });
};

healthRecordSchema.statics.deleteOldRecords = async function (days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.deleteMany({
        recordedAt: { $lt: cutoffDate },
    });

    return result; // Returns { deletedCount: number }
};

healthRecordSchema.statics.getStatistics = async function (userId, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                recordedAt: { $gte: cutoffDate },
            },
        },
        {
            $group: {
                _id: "$userId",
                avg_heart_rate: { $avg: "$heart_rate" },
                min_heart_rate: { $min: "$heart_rate" },
                max_heart_rate: { $max: "$heart_rate" },
                avg_systolic_bp: { $avg: "$systolic_bp" },
                min_systolic_bp: { $min: "$systolic_bp" },
                max_systolic_bp: { $max: "$systolic_bp" },
                avg_blood_sugar: { $avg: "$blood_sugar" },
                min_blood_sugar: { $min: "$blood_sugar" },
                max_blood_sugar: { $max: "$blood_sugar" },
                total_steps: { $sum: "$steps" },
                total_water_intake: { $sum: "$water_intake" },
                record_count: { $sum: 1 },
            },
        },
    ]);
};

export const HealthRecord = mongoose.model("HealthRecord", healthRecordSchema);