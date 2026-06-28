import Habit from "../models/Habit";
import HabitLog from "../models/HabitLog";

export const getHabits = async (req, res) => {
  try {
    const { includeArchived } = req.params;
    const filter = { userID: req.user._id};
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
    const count = await Habit.countDocuments({ userID: req.user._id });
    const newHabit = new Habit({
      userID: req.user._id,
      name,
      description,
      category,
      frequency,
      targetDays,
      color,
      icon,
      order: count;
    });
    // const savedHabit = await newHabit.save();
    res.status(201).json(savedHabit);
  } catch (error) {
    console.error("Error creating habit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateHabit = async (req, res) => {
  try {
    const { habitId } = req.params;
    const { name, description, category, frequency, targetDays, color, icon, isArchived } = req.body;

    const habit = await Habit.findOne({ _id: habitId, userID: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    habit.name = name || habit.name;
    habit.description = description || habit.description;
    habit.category = category || habit.category;
    habit.frequency = frequency || habit.frequency;
    habit.targetDays = targetDays || habit.targetDays;
    habit.color = color || habit.color;
    habit.icon = icon || habit.icon;
    if (typeof isArchived === "boolean") {
      habit.isArchived = isArchived;
    }

    const updatedHabit = await habit.save();
    res.status(200).json(updatedHabit);
  } catch (error) {
    console.error("Error updating habit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};