import express from "express";
const router = express.Router();
//import { isAuthenticated,allowedRoles } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import { register, login, sendOTP, verifyOTP, resetPassword, sendSignupOTP, verifySignupOTP, getAllPuzzles, getCurrentUser, updateUser } from "../controllers/user.controller.js";


router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/send-signup-otp", sendSignupOTP);
router.post("/verify-signup-otp", verifySignupOTP);

router.get("/get-puzzles", getAllPuzzles);

import { isAuthenticated } from "../middleware/auth.middleware.js";
router.get("/me", isAuthenticated, getCurrentUser);
router.post("/reset-password", isAuthenticated, resetPassword);
router.put("/update", isAuthenticated, upload.single("avatar"), updateUser);

export default router;
