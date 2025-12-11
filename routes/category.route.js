import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryStats
} from "../controllers/category.controller.js";
import isAdmin from "../middleware/admin.middleware.js";

const router = express.Router();

// Category CRUD routes
router.post("/create-category", isAdmin, createCategory);
router.get("/get-categories", getCategories);
router.get("/get-category/:id", getCategoryById);
router.put("/update-category/:id", isAdmin, updateCategory);
router.delete("/delete-category/:id", isAdmin, deleteCategory);

// Statistics
router.get("/category-stats", getCategoryStats);

export default router;
