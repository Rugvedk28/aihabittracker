import express from "express";
import { getHabits, createHabit, updateHabit, deleteHabit, archiveHabit, reorderHabits  } from "../controllers/habitController.js";
import { protect } from "../middleware/authMiddleware.js";
// import { archiveHabit } from "../controllers/habitController.js";

const router = express.Router();
router.use(protect);

// router.route("/").get(protect, getHabits).post(protect, createHabit);
// router.route("/:id").put(protect, updateHabit,archiveHabit).delete(protect, deleteHabit, archiveHabit);
router.get("/", getHabits);
router.post("/create", createHabit);
router.put("/:id", updateHabit);
router.delete("/:id", deleteHabit);
router.put("/:id/archive", archiveHabit);
router.put("/reorder", reorderHabits);

export default router;