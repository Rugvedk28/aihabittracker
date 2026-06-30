import mongoose from "mongoose";

const AIInsightSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["weekly", "suggestion", "recovery", "chat", "morning"],
            required: true,
        },
        content: {
            type: String,
            required: true
        },
        meta: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
    }
);

const AIInsight = mongoose.model("AIInsight", AIInsightSchema);

export default AIInsight;