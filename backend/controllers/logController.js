import HabitLog from "../models/HabitLog.js";
import Habit from "../models/Habit.js";
import { todayKey, last90Days, lastNDays, calcStreak } from "../utils/dateHelpers.js";

export const markComplete = async (req, res) => {
    try {
        const { habitId, date} = req.body;
        const completedDate = date || todayKey();
        const habit = await Habit.findOne({ _id: habitId, userId: req.user._id });
        if (!habit) {
            return res.status(404).json({ message: "Habit not found" });
        }
        const existingLog = await HabitLog.findOne({ habitId, userId: req.user._id, completedDate });
        if (existingLog) {
            return res.status(200).json(existingLog);
        }

        const log = await HabitLog.create({
            habitId,
            userId: req.user._id,
            completedDate,
        });
        return res.status(201).json(log);
    } catch (error) {
        console.error("Error fetching habit logs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const unmarkComplete = async (req, res) => {
    try {
        const { habitId, date } = req.body;
        const completedDate = date || todayKey();
        const habit = await Habit.findOne({ _id: habitId, userId: req.user._id });
        if (!habit) {
            return res.status(404).json({ message: "Habit not found" });
        }
        const log = await HabitLog.findOne({ habitId, userId: req.user._id, completedDate });
        if (!log) {
            return res.status(404).json({ message: "Log not found" });
        }
        await log.deleteOne();
        res.status(200).json(log);
    } catch (error) {
        console.error("Error unmarking habit log:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getToday = async (req, res) => {
    try {
        const logs = await HabitLog.find({ userId: req.user._id, completedDate: todayKey() });
        res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching today's habit logs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: { $gte: start, $lte: end },
    });
    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching habit logs for range:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getHeatMap = async (req, res) => {
  try {
    const days = last90Days();
    const logs = await HabitLog.find({
      userId: req.user._id,
      completedDate: { $in: days },
    });
    const counts= {};
    for(const d of days) counts[d]=0;
    for(const log of logs) {
      counts[log.completedDate] = (counts[log.completedDate] || 0) + 1;
    }
    const data=days.map(d=>({date:d,count:counts[d]||0}));
    res.status(200).json(data);
    } catch (error) {
    console.error("Error fetching heatmap data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getHabitStats = async (req, res) => {
    try{
        const habit= await Habit.findOne({ _id: req.params.id, userId: req.user._id });
        if(!habit){
            return res.status(404).json({ message: "Habit not found" });
        }
        const logs= await HabitLog.find({ habitId: habit._id, userId: req.user._id }).sort({completedDate: -1});
        const dateKeys = logs.map(log=>log.completedDate);
        const {current, longest}= calcStreak(dateKeys);

        //completion rate since habit creation
        const createdKey= habit.createdAt.toISOString().split('T')[0];
        const today= todayKey();
        const start= new Date(createdKey);
        const end= new Date(today);
        const totalDays= Math.max(1, Math.round((end-start)/(1000*60*60*24))+1);
        const completionRate= (dateKeys.length/totalDays)*100;

        const monthly={};
        for(const log of logs) {
            const month= log.completedDate.slice(0,7); // YYYY-MM
            monthly[month]= (monthly[month]||0)+1;
        }

        res.json({habit, totalCompletions: dateKeys.length, currentStreak: current, longestStreak: longest, 
            completionRate, monthly});
        console.log("Habit stats fetched successfully for habit:", habit._id);
    }
    catch(error){
        console.error("Error fetching habit stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllStats = async (req, res) => {
    try{
        const habits= await Habit.find({ userId: req.user._id, isArchived: false });
        const days= lastNDays(30);
        const logs= await HabitLog.find({ userId: req.user._id, completedDate: { $in: days } }).sort({completedDate: -1});

        const perHabit= habits.map(h=>{
            const habitLogs= logs.filter(l=>l.habitId.toString()===h._id.toString());
            const dateKeys= habitLogs.map(l=>l.completedDate).sort().reverse();
            const {current, longest}= calcStreak(dateKeys);
            return {habitId: h._id,
                name: h.name,
                icon: h.icon,
                color: h.color,
                category: h.category,
                completions30d: habitLogs.length,
                currentStreak: current,
                longestStreak: longest};
        }
        );
        const last30days= lastNDays(30);
        res.json({perHabit, last30days});
        console.log("All habit stats fetched successfully for user:", req.user._id);
    }
    catch(error){
        console.error("Error fetching all habit stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
