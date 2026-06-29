import express from "express";
import { getHabits, createHabit, updateHabit, deleteHabit, reorderHabits  } from "../controllers/habitController.js";
import { protect } from "../middleware/authMiddleware.js";
import { archiveHabit } from "../controllers/habitController.js";

const router = express.Router();
router.use(protect);

router.get("/", getHabits);
router.put("/reorder", reorderHabits);
router.post("/", createHabit);
router.put("/:id", updateHabit);
router.delete("/:id", deleteHabit);
router.put("/:id/archive", archiveHabit);

export default router;
