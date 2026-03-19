import express from "express";
import { getUserProfile } from "../controllers/user.controller.js";
import { optionalAuth } from "../middleware/auth.js";
const route= express.Router();
route.get("/:id",optionalAuth,getUserProfile);
export default route