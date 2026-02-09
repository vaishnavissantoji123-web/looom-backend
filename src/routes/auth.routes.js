import express from "express";
import { requireFields } from "../middleware/validate.js";
import { login, register } from "../controllers/auth.controller.js";


const router=express.Router();
router.post("/login",requireFields(["username","password"]),login);
router.post("/register",requireFields(["username","password"]),register);
export default router