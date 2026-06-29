//HabitLog tracks the completion of habits by users. Each log entry corresponds to a specific habit completed on a 
// specific date, along with optional notes.
import mongoose from "mongoose";
import {
  createMockQuery,
  getMockStore,
  isMockDb,
  matchesQuery,
} from "../utils/mockDb.js";

const habitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    habitId: {
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

habitLogSchema.index({ userId: 1, habitId: 1, completedDate: 1 }, { unique: true });

const HabitLog = mongoose.model("HabitLog", habitLogSchema);

const originalFind = HabitLog.find.bind(HabitLog);
const originalFindOne = HabitLog.findOne.bind(HabitLog);
const originalDeleteMany = HabitLog.deleteMany.bind(HabitLog);
const originalCreate = HabitLog.create.bind(HabitLog);
const originalSave = HabitLog.prototype.save;
const originalDeleteOne = HabitLog.prototype.deleteOne;

HabitLog.create = async function (data) {
  if (!isMockDb()) {
    return originalCreate(data);
  }

  const log = new HabitLog(data);
  await log.save();
  return log;
};

HabitLog.find = function (query = {}) {
  if (!isMockDb()) {
    return originalFind(query);
  }

  const logs = getMockStore().logs.filter((doc) => matchesQuery(doc, query));
  return createMockQuery(logs);
};

HabitLog.findOne = async function (query = {}) {
  if (!isMockDb()) {
    return originalFindOne(query);
  }

  const found = getMockStore().logs.find((doc) => matchesQuery(doc, query));
  return found ? HabitLog.hydrate(found) : null;
};

HabitLog.deleteMany = async function (query = {}) {
  if (!isMockDb()) {
    return originalDeleteMany(query);
  }

  const store = getMockStore();
  const before = store.logs.length;
  store.logs = store.logs.filter((doc) => !matchesQuery(doc, query));
  return { deletedCount: before - store.logs.length };
};

HabitLog.prototype.save = async function () {
  if (!isMockDb()) {
    return originalSave.call(this);
  }

  const plain = this.toObject({ depopulate: true });
  const logs = getMockStore().logs;
  const index = logs.findIndex((doc) => String(doc._id) === String(plain._id));
  if (index >= 0) {
    logs[index] = plain;
  } else {
    logs.push(plain);
  }

  return this;
};

HabitLog.prototype.deleteOne = async function () {
  if (!isMockDb()) {
    return originalDeleteOne.call(this);
  }

  const logs = getMockStore().logs;
  const index = logs.findIndex((doc) => String(doc._id) === String(this._id));
  if (index >= 0) {
    logs.splice(index, 1);
  }

  return this;
};

export default HabitLog;
