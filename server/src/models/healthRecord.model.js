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
            type: Number, // Store in ml for consistency
            default: 0,
            min: [0, "Water intake cannot be negative"],
            max: [10000, "Water intake seems unrealistic (in ml)"],
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
        timestamps: false, // We use recordedAt for TTL, so no need for timestamps
    }
);

// Compound index for efficient queries: userId + recordedAt
// This helps with queries like "get all records for user X in last N days"
healthRecordSchema.index({ userId: 1, recordedAt: -1 });

// Pre-save middleware for data validation
healthRecordSchema.pre("save", function () {
    // Ensure recordedAt is set (in case it's manually overridden)
    if (!this.recordedAt) {
        this.recordedAt = new Date();
    }
});

// Static method to create a new health record
healthRecordSchema.statics.createRecord = async function (userId, healthData) {
    try {
        const record = new this({
            userId,
            ...healthData,
        });
        return await record.save();
    } catch (error) {
        throw new ApiError(400,`Failed to create health record: ${error.message}`);
    }
};

// Static method to get user's health records (last N days)
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

// Static method to manually delete old records (optional, for backup cleanup)
healthRecordSchema.statics.deleteOldRecords = async function (days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.deleteMany({
        recordedAt: { $lt: cutoffDate },
    });

    return result; // Returns { deletedCount: number }
};

// Static method to get statistics for anomaly detection
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