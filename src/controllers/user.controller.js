import { pool } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const result = await pool.query(
    `
    SELECT
      u.user_id,
      u.username,
      COUNT(f.follower_id) AS followers_count
    FROM users u
    LEFT JOIN follows f
      ON f.following_id = u.user_id
    WHERE u.user_id = $1
    GROUP BY u.user_id
    `,
    [userId],
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(result.rows[0]);
});