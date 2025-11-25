import express from "express";
const router = express.Router();
import { isAuthenticated,allowedRoles } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import { register, login } from "../controllers/auth.controller.js";

router.post("/register", upload.single("image"), register);
router.post("/login", login);

export default router;
