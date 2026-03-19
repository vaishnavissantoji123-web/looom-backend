import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { initDatabase } from "../db/init.js";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/posts.routes.js";
import searchRoutes from "./routes/search.routes.js";
import usersRoutes from "./routes/user.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import likesFollowRoutes from "./routes/likes-follow.routes.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

// Add your production frontend URL to this list!
const allowedOrigins = ["http://localhost:5173", "http://localhost:3001"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

app.use(express.json());

// Basic health check
app.get("/", (req, res) => {
  res.json({ message: "API running", env: process.env.NODE_ENV });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1", likesFollowRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/activity", activityRoutes);

app.use(errorHandler);

// --- VERCEL VS LOCAL LOGIC ---

if (process.env.NODE_ENV !== "production") {
  // Only run this in local development
  const PORT = process.env.PORT || 3000;
  
  async function startLocalServer() {
    try {
      await pool.query("SELECT 1");
      console.log("Database connection verified");
      await initDatabase();
      
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("Failed to start local server:", err);
    }
  }

  // Hello

  startLocalServer();
}

// Export the app for Vercel's Serverless handler
export default app;

