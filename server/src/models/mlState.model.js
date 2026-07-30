import mongoose from "mongoose";

const mlStateSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
            unique: true, 
        },
        rrcf_state_b64: {
            type: String,
            required: true,
        },
        zscore_state: {
            day_count: {
                type: Number,
                required: true,
                default: 0,
            },
            means: {
                heart_rate: { type: Number, default: 0 },
                systolic_bp: { type: Number, default: 0 },
                blood_sugar: { type: Number, default: 0 },
                steps: { type: Number, default: 0 },
                water_intake: { type: Number, default: 0 },
            },
            variances: {
                heart_rate: { type: Number, default: 0 },
                systolic_bp: { type: Number, default: 0 },
                blood_sugar: { type: Number, default: 0 },
                steps: { type: Number, default: 0 },
                water_intake: { type: Number, default: 0 },
            },
        },
    },
    {
        timestamps: true,
    }
);

export const MLState = mongoose.model("MlState", mlStateSchema);