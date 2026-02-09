import { pool } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const toggleLike = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.user_id;
  const { action } = req.body;

  res.json({ postId, userId, action });

  if (!["like", "unlike"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  const post = await pool.query("SELECT post_id FROM posts WHERE post_id=$1", [
    postId,
  ]);
  if (!post.rowCount) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (action === "like") {
    await pool.query(
      "INSERT INTO likes (user_id, post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [userId, postId],
    );
  }

  if (action === "unlike") {
    await pool.query("DELETE FROM likes WHERE user_id=$1 AND post_id=$2", [
      userId,
      postId,
    ]);
  }

  const count = await pool.query(
    "SELECT likes_count FROM posts WHERE post_id=$1",
    [postId],
  );

  res.json({
    liked: action === "like",
    likes_count: count.rows[0].likes_count,
  });
});

export const toggleFollow = asyncHandler(async (req, res) => {
  const targetUser = req.params.userId;
  const userId = req.user.user_id;
  const { action } = req.body;

  if (!["follow", "unfollow"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  if (targetUser === userId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  const user = await pool.query("SELECT user_id FROM users WHERE user_id=$1", [
    targetUser,
  ]);
  if (!user.rowCount) {
    return res.status(404).json({ error: "User not found" });
  }

  if (action === "follow") {
    await pool.query(
      "INSERT INTO follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [userId, targetUser],
    );
  }

  if (action === "unfollow") {
    await pool.query(
      "DELETE FROM follows WHERE follower_id=$1 AND following_id=$2",
      [userId, targetUser],
    );
  }

  res.json({
    following: action === "follow",
  });
});