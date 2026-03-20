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

// --- CORS ---
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

// --- ROUTES ---
app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1", likesFollowRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/activity", activityRoutes);

app.use(errorHandler);

// --- STARTUP LOGIC ---

async function initialize() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connection verified");
    await initDatabase();
    console.log("✅ Database tables initialized");
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    // In dev, we might want to exit. In prod, the function will just fail this request.
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
}

if (process.env.NODE_ENV !== "production") {
  // DEV MODE: Use traditional app.listen and init immediately
  const PORT = process.env.PORT || 3000;
  
  initialize().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Local server running on http://localhost:${PORT}`);
    });
  });
} else {
  // PRODUCTION MODE (Vercel): 
  // We run initDatabase once when the lambda is first "warmed up"
  initialize();
}

// Export for Vercel
export default app;