import mongoose from "mongoose";

const categories = ["Health and Fitness", "Productivity", "Learning", "Finance", "Social", "Creative",
    "Self-Care", "Personal Growth", "Other"
];

const habitSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
        trim: true,
    },
    category: {
        type: String,
        enum: categories,
        default: "Other",
    },
    frequency: {
        type: String,
        enum: ["Daily", "Weekly", "Monthly"],
        default: "Daily",
    },
    targetDays: {
        type: Number,
        default: 7,
        min: 1,
        max:7
    },
    color:{
        type: String,
        default: "#46affa"
    },
    icon: {
        type: String,
        default: "💫",
    },
    isArchived: {
        type: Boolean,
        default: false,
    },
    order: {
        type: Number,
        default: 0,
    },
    },
    {
        timestamps: true,
    }
);
    
export const HABIT_CATEGORIES = categories;
const Habit = mongoose.model("Habit", habitSchema);

export default Habit;