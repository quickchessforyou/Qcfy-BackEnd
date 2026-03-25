import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import connectDB from "./config/db.js"
import puzzleRoutes from "./routes/puzzle.route.js";
import competitionRoutes from "./routes/competition.route.js";
import liveCompetitionRoutes from "./routes/liveCompetition.route.js";
import categoryRoutes from "./routes/category.route.js";
import { Chess } from "chess.js";
import { initializeSocketHandlers } from "./utils/socketHandlers.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

// Required for correct client IP detection behind Nginx (rate limiting, logs, etc.)
// If you have multiple proxy hops, set this to the exact hop count instead of "1".
app.set("trust proxy", 1);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowed = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://test.quickchessforyou.com",
        "https://quickchessforyou.com",
        "https://admin.quickchessforyou.com"
      ].filter(Boolean);
      
      if (allowed.includes(origin) || origin.endsWith('quickchessforyou.com')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Initialize socket handlers
initializeSocketHandlers(io);


// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://test.quickchessforyou.com",
  "https://quickchessforyou.com",
  "https://admin.quickchessforyou.com"
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser clients (curl/postman) where Origin is not set
      if (!origin) return callback(null, true);
      
      // Allow if origin is explicitly in list, or matches proper subdomains
      if (allowedOrigins.includes(origin) || origin.endsWith('quickchessforyou.com')) {
        return callback(null, true);
      }
      
      // Returns false instead of an Error, allowing the browser to see a clean CORS error
      // instead of crashing the server request pipeline with a 500 error.
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Routes
app.use("/api/user", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/puzzle", puzzleRoutes)
app.use("/api/competition", competitionRoutes)
app.use("/api/live-competition", liveCompetitionRoutes)
app.use("/api/category", categoryRoutes)

app.get("/", (req, res) => {
  return res.status(200).json({ message: "QuickChess4U backend is running" });
})


console.log("Chess import:", Chess);


// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
});
server.timeout = 10 * 60 * 1000; // 10 minutes for large bulk imports

// Export io for use in other modules
export { io };