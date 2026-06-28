import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    habitID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
      index: true,
    },
    completedDate: {
      type: String,
      required: true, //YYYY-MM-DD
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

HabitLogSchema.index({ userID: 1, habitID: 1, completedDate: 1 }, { unique: true });

const HabitLog = mongoose.model("HabitLog", habitSchema);

export default HabitLog;