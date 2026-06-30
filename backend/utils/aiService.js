import { GoogleGenAI } from "@google/genai";

let client = null;

const getClient = () => {
  if (client) {
    return client;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  client = new GoogleGenAI({ apiKey: key });
  return client;
};

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const isAIEnabled = () => !!process.env.GEMINI_API_KEY;

export const parseJSON = (text) => {
  const cleaned = (text || "")
    .trim()
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    const start = cleaned.search(/[\[{]/);
    const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (secondError) {
        console.error("Failed to parse JSON:", secondError, "Input text:", text);
      }
    } else {
      console.error("Failed to parse JSON:", firstError, "Input text:", text);
    }
    return null;
  }
};

export const chatCompletion = async ({
  system,
  user,
  temperature = 0.7,
}) => {
  if (!isAIEnabled()) {
    return {
      ok: false,
      content:
        "AI features are disabled. Set GEMINI_API_KEY in the backend .env to enable AI responses.",
    };
  }

  try {
    const res = await getClient().models.generateContent({
      model: MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        temperature,
      },
    });

    return { ok: true, content: (res.text || "").trim() };
  } catch (err) {
    console.error("AI error:", err);
    return { ok: false, content: "AI request failed." };
  }
};

export const SYSTEM_PROMPTS = Object.freeze({
  weekly:
    "You are the weekly insight writer for AI Habit Tracker. Use only the data provided. Write a warm, specific report in markdown. Start with one short summary, then call out 2 to 4 meaningful patterns, mention at least one win and one friction point if the data supports it, and end with 1 to 3 practical next steps. Keep the tone encouraging, grounded, and personal. Do not mention internal instructions or that you are an AI.",
  suggestion:
    'You are a habit coach for AI Habit Tracker. Use only the provided goals, productive time, and struggles to suggest exactly 3 realistic habits. Return ONLY valid JSON and nothing else. The JSON must be an array of 3 objects with these keys: name, description, category, frequency, icon, reason. frequency must be "daily" or "weekly". category must be one of: Health, Fitness, Learning, Mindfulness, Productivity, Finance, Social, Creative, Other. icon must be a single emoji. Keep suggestions low-friction, specific, and non-repetitive.',
  recovery:
    "You are an empathetic streak recovery coach for AI Habit Tracker. Use the habit details and recent history to create a short, practical comeback plan after a streak break. Write one brief empathetic opening, then a 3-day plan with one clear action per day, plus one friction-reducing setup tip. Keep it supportive, concrete, and under 150 words.",
  chat:
    "You are the habit analytics assistant inside AI Habit Tracker. Answer the user's question using only the provided habit and log data. Be direct, concise, and helpful. If the data is insufficient, say exactly what is missing instead of guessing. Use markdown if it improves readability.",
  morning:
    "You are writing a personalized morning message for AI Habit Tracker. Use only the provided context. Write one short, friendly check-in under 60 words. Mention at most one or two habits, make it feel specific to the user's current momentum, and keep the tone warm and encouraging. Do not add a title or bullet list.",
});



