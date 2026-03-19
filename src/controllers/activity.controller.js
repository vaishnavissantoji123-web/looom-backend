import { pool } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const getActivity = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const limit = Number(req.query.limit) || 20;
  const offSet = Number(req.query.offset) || 0;
  const { rows } = await pool.query(
    `SELECT * FROM (
        --Likes
        SELECT 'like' AS type,
        l.created_at,
        u.user_id,
        u.username,
        p.post_id,
        p.content
        FROM likes l
        JOIN posts p ON p.post_id=l.post_id
        JOIN users u oN u.user_id=l.user_id
        WHERE p.user_id=$1 AND l.user_id !=$1
        
        UNION ALL
        
        --Replies
        SELECT 'reply' AS type,
        p.created_at,
        u.user_id,
        u.username,
        p.parent_id AS post_id,
        p.content
        FROM posts p
        JOIN posts parent ON parent.post_id=p.parent_id
        JOIN users u ON u.user_id=p.user_id
        WHERE parent.user_id=$1 AND p.user_id!=$1

        UNION ALL

        --Follows
        SELECT 'follow' AS type,
        f.created_at,
        u.user_id,
        u.username,
        NULL AS post_id,
        NULL AS content
        FROM follows f
        JOIN users u ON u.user_id=f.follower_id
        WHERE f.following_id=$1 AND f.follower_id!=$1
        )activity
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
    [userId, limit, offSet],
  );
  res.json(rows);
});