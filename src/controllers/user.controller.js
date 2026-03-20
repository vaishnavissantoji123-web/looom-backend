import { pool } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const viewerId = req.user?.user_id || null;

  const result = await pool.query(
    `
    SELECT
      u.user_id,
      u.username,
      COUNT(f.follower_id)::int AS followers_count,
      EXISTS (
        SELECT 1
        FROM follows
        WHERE follower_id = $2
        AND following_id = u.user_id
      ) AS following
    FROM users u
    LEFT JOIN follows f
      ON f.following_id = u.user_id
    WHERE u.user_id = $1
    GROUP BY u.user_id
    `,
    [userId, viewerId],
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(result.rows[0]);
});
