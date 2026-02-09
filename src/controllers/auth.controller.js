import bcrypt from "bcrypt";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middleware/async-handler.js";

export const register = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (username,password_hash)
        VALUES ($1,$2)
        RETURNING user_id , username`,
    [username, hash],
  );
  return res.status(201).json(result.rows[0]);
});
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query(`SELECT*FROM users WHERE username=$1`, [
    username,
  ]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ user_id: user.user_id,name:user.username }, process.env.JWT_SECRET);
  res.json({ token })
});