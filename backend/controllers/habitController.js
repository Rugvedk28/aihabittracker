import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

export const getHabits = async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const filter = { userId: req.user._id };
    if(includeArchived !== "true") {
      filter.isArchived = false;
    }
    const habits = await Habit.find(filter).sort({ order: 1 });
    res.status(200).json(habits);
  } catch (error) {
    console.error("Error fetching habit logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createHabit = async (req, res) => {
  try {
    const { name, description, category, frequency, targetDays, color, icon } = req.body;
    if(!name) {
      return res.status(400).json({ message: "Habit name is required" });
    }
    const count = await Habit.countDocuments({ userId: req.user._id });
    const newHabit = new Habit({
      userId: req.user._id,
      name,
      description,
      category,
      frequency,
      targetDays,
      color,
      icon,
      order: count
    });
    const savedHabit = await newHabit.save();
    res.status(201).json(savedHabit);
  } catch (error) {
    console.error("Error creating habit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }
    const fields = ["name", "description", "category", "frequency", "targetDays", "color", "icon", "isArchived"];

    for(const f of fields) {
      if(req.body[f] !== undefined) {
        habit[f] = req.body[f];
      }
    }
    await habit.save();
    res.status(200).json(habit);
  } catch (error) {
    console.error("Error updating habit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }
    await HabitLog.deleteMany({ habitId: habit._id });
    await habit.deleteOne();
    res.status(200).json({ message: "Habit deleted successfully" });
  } catch (error) {
    console.error("Error deleting habit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const archiveHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }
    habit.isArchived = true;
    await habit.save();
    res.status(200).json({ message: "Habit archived successfully" });
  } catch (error) {
    console.error("Error archiving habit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const reorderHabits = async (req, res) => {
  try {
    const { orderedHabitIds } = req.body;
    if (!Array.isArray(orderedHabitIds)) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const habits = await Habit.find({ userId: req.user._id, _id: { $in: orderedHabitIds } });

    if (habits.length !== orderedHabitIds.length) {
      return res.status(400).json({ message: "Some habits not found" });
    }

    for (let i = 0; i < orderedHabitIds.length; i++) {
      const habitId = orderedHabitIds[i];
      const habit = habits.find(h => h._id.toString() === habitId);
      if (habit) {
        habit.order = i;
        await habit.save();
      }
    }

    res.status(200).json({ message: "Habits reordered successfully" });
  } catch (error) {
    console.error("Error reordering habits:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
