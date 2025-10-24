import express from "express";
import {
  getUsers,
  login,
  signup,
  updateUser,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getLawyers
} from "../controllers/user.js";

import { authenticate, authorize, authorizeAdmin, authorizeLawyer } from "../middlewares/auth.js";
const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes - require authentication
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);

// Lawyer-specific routes
router.get("/lawyers", getLawyers); // Public route to get available lawyers

// Admin routes
router.get("/users", authenticate, authorizeAdmin, getUsers);
router.put("/users/:userId", authenticate, authorizeAdmin, updateUser);

export default router;
