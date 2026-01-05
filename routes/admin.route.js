import express from "express";
import { loginAdmin } from "../controllers/admin.controller.js";
import { getAllUsers, deleteUserById } from "../controllers/user.controller.js";

const router = express.Router();

// Admin login
router.post("/login", loginAdmin);

// Admin user management routes (protected)
// Note: Add admin authentication middleware when available
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUserById);

export default router;
