import mongoose from "mongoose";
import {
  createMockQuery,
  getMockStore,
  isMockDb,
  matchesQuery,
} from "../utils/mockDb.js";

const categories = [
  "Health",
  "Fitness",
  "Learning",
  "Mindfulness",
  "Productivity",
  "Social",
  "Finance",
  "Creative",
  "Other",
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
        enum: ["daily", "weekly"],
        default: "daily",
      },
      targetDays: {
        type: Number,
        default: 7,
        min: 1,
        max: 7,
      },
      color: {
        type: String,
        default: "#46affa",
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

const originalFind = Habit.find.bind(Habit);
const originalFindOne = Habit.findOne.bind(Habit);
const originalCountDocuments = Habit.countDocuments.bind(Habit);
const originalCreate = Habit.create.bind(Habit);
const originalSave = Habit.prototype.save;
const originalDeleteOne = Habit.prototype.deleteOne;

Habit.create = async function (data) {
  if (!isMockDb()) {
    return originalCreate(data);
  }

  const habit = new Habit(data);
  await habit.save();
  return habit;
};

Habit.find = function (query = {}) {
  if (!isMockDb()) {
    return originalFind(query);
  }

  const habits = getMockStore().habits.filter((doc) => matchesQuery(doc, query));
  return createMockQuery(habits);
};

Habit.findOne = async function (query = {}) {
  if (!isMockDb()) {
    return originalFindOne(query);
  }

  const found = getMockStore().habits.find((doc) => matchesQuery(doc, query));
  return found ? Habit.hydrate(found) : null;
};

Habit.countDocuments = async function (query = {}) {
  if (!isMockDb()) {
    return originalCountDocuments(query);
  }

  return getMockStore().habits.filter((doc) => matchesQuery(doc, query)).length;
};

Habit.prototype.save = async function () {
  if (!isMockDb()) {
    return originalSave.call(this);
  }

  const plain = this.toObject({ depopulate: true });
  const habits = getMockStore().habits;
  const index = habits.findIndex((doc) => String(doc._id) === String(plain._id));
  if (index >= 0) {
    habits[index] = plain;
  } else {
    habits.push(plain);
  }

  return this;
};

Habit.prototype.deleteOne = async function () {
  if (!isMockDb()) {
    return originalDeleteOne.call(this);
  }

  const habits = getMockStore().habits;
  const index = habits.findIndex((doc) => String(doc._id) === String(this._id));
  if (index >= 0) {
    habits.splice(index, 1);
  }

  return this;
};

export default Habit;
