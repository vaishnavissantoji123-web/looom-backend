import express from "express";
import {
  toggleFollow,
  toggleLike,
} from "../controllers/likes-follow.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Like system (post related)
router.post("/posts/:postId/like", auth, toggleLike);

// Follow system (user related)
router.post("/users/:userId/follow", auth, toggleFollow);

export default router;