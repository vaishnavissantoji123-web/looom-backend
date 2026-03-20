import express from "express";
import {
  createPost,
  deletePost,
  getFeed,
  getPostThread,
  getReplies,
  getUserPosts,
} from "../controllers/posts.controller.js";
import { auth, optionalAuth } from "../middleware/auth.js";
import { requireFields } from "../middleware/validate.js";

const router = express.Router();

router.post("/", auth, requireFields(["content"]), createPost);

router.get("/feed", optionalAuth, getFeed);
router.get("/user/:userId", optionalAuth, getUserPosts);
router.get("/:postId/replies", getReplies);
router.get("/:postId", optionalAuth, getPostThread);

router.delete("/:postId", auth, deletePost);

export default router;
