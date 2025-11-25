import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/user.route.js";
import connectDB from "./config/db.js"



// Config
dotenv.config();
connectDB();

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use("/api/user",userRoutes)

app.get("/",(req,res)=>{
    console.log("welcome to game ");
})

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});