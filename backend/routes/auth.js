import express from "express";
import { register, login, updateProfile, me } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register a new user
router.post("/register", register);

// Login a user
router.post("/login", login);

// Get current user (protected route)
router.get("/me", protect, me);

// Update user profile (protected route)
router.put("/profile", protect, updateProfile);

// Logout a user
// router.post("/logout", logoutUser);


export default router;
