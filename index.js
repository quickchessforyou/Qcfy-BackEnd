import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import connectDB from "./config/db.js"
import puzzleRoutes from "./routes/puzzle.route.js";
import competitionRoutes from "./routes/competition.route.js";
import categoryRoutes from "./routes/category.route.js";
import { Chess } from "chess.js";



// Config
dotenv.config();
connectDB();

const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use("/api/user",userRoutes)
app.use("/api/admin",adminRoutes)
app.use("/api/puzzle",puzzleRoutes)
app.use("/api/competition",competitionRoutes)
app.use("/api/category",categoryRoutes)

app.get("/",(req,res)=>{
    console.log("welcome to game ");
})


console.log("Chess import:", Chess);


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});