import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import { initDatabase } from "../db/init.js";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/posts.routes.js";
import likesFollowRoutes from "./routes/likes-follow.routes.js";
import { errorHandler } from "./middleware/error.js";

const allowedOrigins = ["http://localhost:5174","http://localhost:5173"];

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by cros"));
      }
    },
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

// auth routes
app.use("/api/v1/auth", authRoutes);

// posts routes
app.use("/api/v1/posts", postRoutes);

// Likes and follows routes
app.use("/api/v1", likesFollowRoutes);

app.use(errorHandler); // must be last

const PORT = process.env.PORT || 3000;

// STARTUP SEQUENCE
async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection verified");
    await initDatabase();
    console.log("Database Initialized");

    app.listen(PORT, () => {
      console.log(`Server running on port http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to database");
    console.error(err);
    process.exit(1); // Stop app if DB fails
  }
}

startServer();