import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import AIInsight from "../models/AIInsight.js";
import { chatCompletion, parseJSON, SYSTEM_PROMPTS } from "../utils/aiService.js";
import { lastNDays, calcStreak, todayKey } from "../utils/dateHelpers.js";

const ALLOWED_CATEGORIES = new Set([
    "Health",
    "Fitness",
    "Learning",
    "Mindfulness",
    "Productivity",
    "Social",
    "Finance",
    "Creative",
    "Other",
]);

const normalizeSuggestion = (item = {}) => ({
    name: item.name || "",
    description: item.description || "",
    category: ALLOWED_CATEGORIES.has(item.category) ? item.category : "Other",
    frequency: String(item.frequency || "daily").toLowerCase() === "weekly" ? "weekly" : "daily",
    icon: item.icon || "✨",
    reason: item.reason || "",
});

const buildWeeklyContext = async (userId) => {
    const habits = await Habit.find({ userId, isArchived: false });
    const days = lastNDays(7);

    const logs = await HabitLog.find({
        userId,
        completedDate: { $gte: days[0], $lte: days[days.length - 1] },
    });

    const perHabit = habits.map((h) => {
        const completed = logs.filter(
            (l) => String(l.habitId) === String(h._id)
        ).length;

        return {
            name: h.name,
            category: h.category,
            frequency: h.frequency,
            completedDays: completed,
            targetDays: h.targetDays,
        };
    });

    return { days, perHabit };
};

export const weeklyReport = async (req, res) => {
    try {
        const ctx = await buildWeeklyContext(req.user._id);

        if (!ctx.perHabit.length) {
            return res.json({
                content:
                    "You don't have any active habits yet. Create your first habit to start tracking — I'll generate a weekly report once you have some data.",
            });
        }

        const userMsg = `Here is the user's habit data for the past 7 days (${ctx.days[0]} to ${ctx.days[6]}):\n\n${ctx.perHabit
            .map(
                (h) =>
                    `- ${h.name} (${h.category}, ${h.frequency}): completed ${h.completedDays} of the past 7 days, target ${h.targetDays}`
            )
            .join("\n")}\n\nPlease write the personalised weekly report now.`;

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.weekly,
            user: userMsg,
        });

        await AIInsight.create({
            userId: req.user._id,
            type: "weekly",
            content,
        });

        res.json({ content });
    } catch (err) {
        // console.error(err);
        res.status(500).json({message: err.message});
    }
};

export const suggestHabits = async (req, res) => {

    try {

        const {
            goals,
            productiveTime,
            struggles,
        } = req.body;

        if (!goals || !productiveTime || !struggles) {
            return res.status(400).json({
                message: "Please fill all required fields.",
            });
        }

        const userMsg = `
User Details

Goals:
${goals}

Most Productive Time:
${productiveTime}

Current Struggles:
${struggles}

        Generate exactly 3 habits.

Return ONLY valid JSON.

Format:

[
 {
   "name":"",
   "description":"",
   "category":"",
   "frequency":"",
   "icon":"",
   "reason":""
 }
]
`;

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.suggestion,
            user: userMsg,
        });

        let suggestions = parseJSON(content);

        if (!suggestions) {

            suggestions = [

                {
                    name: "Morning Walk",
                    description: "Walk for 20 minutes.",
                    category: "Health",
                    frequency: "Daily",
                    icon: "🚶",
                    reason: "Improves physical and mental wellbeing.",
                },
                {
                    name: "Read 10 Pages",
                    description: "Read any book for 10 pages.",
                    category: "Learning",
                    frequency: "Daily",
                    icon: "📚",
                    reason: "Builds consistent learning habits.",
                },
                {
                    name: "Meditation",
                    description: "Meditate for 5 minutes.",
                    category: "Mindfulness",
                    frequency: "Daily",
                    icon: "🧘",
                    reason: "Improves focus and reduces stress.",
                },
            ];
        }

        await AIInsight.create({

            userId: req.user._id,

            type: "suggestion",

            content: JSON.stringify(suggestions.map(normalizeSuggestion)),
        });

        return res.json({

            success: true,

            suggestions: suggestions.map(normalizeSuggestion),
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message,
        });
    }
};

export const recoveryPlan = async (req, res) => {
    try {
        const habitId = req.body.habitId || req.params.habitId;

        if (!habitId) {
            return res.status(400).json({
                success: false,
                message: "habitId is required.",
            });
        }

        const habit = await Habit.findOne({
            _id: habitId,
            userId: req.user._id,
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: "Habit not found.",
            });
        }

        const logs = await HabitLog.find({
            userId: req.user._id,
            habitId,
        }).sort({ completedDate: -1 });

        const lastCompleted =
            logs.length > 0
                ? logs[0].completedDate
                : "Never completed";

        const userMsg = `
Habit Name:
${habit.name}

Category:
${habit.category}

Frequency:
${habit.frequency}

Target Days:
${habit.targetDays}

Last Completed:
${lastCompleted}

The user has lost momentum.

Write a short motivational recovery plan.

Mention:

- why consistency matters
- how to restart today
- one small achievable step
- encouraging ending

Keep it under 150 words.
`;

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.recovery,
            user: userMsg,
        });

        await AIInsight.create({
            userId: req.user._id,
            type: "recovery",
            content,
            meta: {
                habitId,
            },
        });

        return res.json({
            success: true,
            content,
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const chatAnalysis = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: "Question is required.",
            });
        }

        const habits = await Habit.find({
            userId: req.user._id,
            isArchived: false,
        });

        const logs = await HabitLog.find({
            userId: req.user._id,
        });

        const summary = habits.map((habit) => {
            const completed = logs.filter(
                (log) => String(log.habitId) === String(habit._id)
            ).length;

            return {
                name: habit.name,
                category: habit.category,
                frequency: habit.frequency,
                completed,
                targetDays: habit.targetDays,
            };
        });

        const userMsg = `
Here is the user's habit summary:

${JSON.stringify(summary, null, 2)}

Question:
${question}

Answer naturally using only the provided habit data.
If you don't have enough information, say so honestly.
`;

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.chat,
            user: userMsg,
        });

        await AIInsight.create({
            userId: req.user._id,
            type: "chat",
            content,
            meta: {
                question,
            },
        });

        return res.json({
            success: true,
            content,
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const morningMotivation = async (req, res) => {
    try {

        const habits = await Habit.find({
            userId: req.user._id,
            isArchived: false,
        });

        if (!habits.length) {
            return res.json({
                success: true,
                content:
                    "Good morning! 🌞 Today is a fresh start. Create your first habit and let's begin building consistency together.",
            });
        }

        const habitList = habits
            .map(
                (habit) =>
                    `• ${habit.name} (${habit.category}, ${habit.frequency})`
            )
            .join("\n");

        const userMsg = `
The user has the following active habits:

${habitList}

Write a short morning motivation.

Requirements:

- Positive and encouraging
- Mention consistency
- Mention one or two habits naturally
- Keep it under 100 words
- End with an uplifting sentence
`;

        const { content } = await chatCompletion({
            system: SYSTEM_PROMPTS.morning,
            user: userMsg,
            temperature: 0.8,
        });

        await AIInsight.create({
            userId: req.user._id,
            type: "morning",
            content,
        });

        return res.json({
            success: true,
            content,
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
