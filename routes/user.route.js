import express from "express";
const router = express.Router();
//import { isAuthenticated,allowedRoles } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import { register, login, sendOTP, verifyOTP, resetPassword ,getAllPuzzles} from "../controllers/user.controller.js";


router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

router.get("/get-puzzles", getAllPuzzles);

import { isAuthenticated } from "../middleware/auth.middleware.js";
router.post("/reset-password", isAuthenticated, resetPassword);

export default router;
