import { getUserProfile } from "../controllers/user.controller.js";
import express from "express";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();
router.get("/:id", optionalAuth, getUserProfile);
export default router;
