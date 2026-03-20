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

// 1. CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3001",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// 2. Database Connection Middleware (Serverless Friendly)
// This ensures the DB is ready before handling requests without blocking the boot process
let isDbInitialized = false;
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await pool.query("SELECT 1");
      await initDatabase();
      isDbInitialized = true;
      console.log("Database Initialized");
    } catch (err) {
      console.error("Database connection failed:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }
  next();
});

// 3. Routes
app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1", likesFollowRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/activity", activityRoutes);

// 4. Error Handling (Must be last)
app.use(errorHandler);

// 5. Execution Logic
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Local server running on http://localhost:${PORT}`);
  });
}

// CRITICAL: Export for Vercel
export default app;