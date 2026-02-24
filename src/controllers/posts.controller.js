import { pool } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";

const getPagination = (req) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const offset = parseInt(req.query.offset) || 0;
  return { limit, offset };
};

const postSelect = (withLiked = false) => `
  p.post_id,
  p.content,
  p.parent_id,
  p.likes_count,
  p.replies_count,
  p.created_at,
  u.username
  ${
    withLiked
      ? `,
  EXISTS (
    SELECT 1 FROM likes l
    WHERE l.post_id = p.post_id
    AND l.user_id = $USER_ID
  ) AS liked`
      : ``
  }
`;

//
// Create Post or Reply
//
export const createPost = asyncHandler(async (req, res) => {
  const { content, parent_id } = req.body;

  if (parent_id) {
    const parent = await pool.query("SELECT 1 FROM posts WHERE post_id=$1", [
      parent_id,
    ]);
    if (!parent.rowCount) {
      return res.status(404).json({ error: "Parent post not found" });
    }
  }

  const result = await pool.query(
    `INSERT INTO posts (user_id, content, parent_id)
     VALUES ($1,$2,$3)
     RETURNING post_id, content, parent_id, likes_count, replies_count, created_at`,
    [req.user.user_id, content, parent_id || null],
  );

  res.status(201).json(result.rows[0]);
});

//
// Global Feed (Top-Level Posts)
//
export const getFeed = asyncHandler(async (req, res) => {
  const { limit, offset } = getPagination(req);
  const userId = req.user?.user_id || null;

  const result = await pool.query(
    `
    SELECT ${postSelect(true).replace("$USER_ID", "$1")}
    FROM posts p
    JOIN users u ON u.user_id = p.user_id
    WHERE p.parent_id IS NULL
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset],
  );

  res.json(result.rows);
});

//
// Direct Replies (Conversation View)
//
export const getReplies = asyncHandler(async (req, res) => {
  const { limit, offset } = getPagination(req);
  const userId = req.user?.user_id || null;

  const result = await pool.query(
    `
    SELECT ${postSelect(true).replace("$USER_ID", "$2")}
    FROM posts p
    JOIN users u ON u.user_id = p.user_id
    WHERE p.parent_id = $1
    ORDER BY p.created_at ASC
    LIMIT $3 OFFSET $4
    `,
    [req.params.postId, userId, limit, offset],
  );

  res.json(result.rows);
});

//
// Get Post Thread (Main Post + Direct Replies)
//
export const getPostThread = asyncHandler(async (req, res) => {
  const { limit, offset } = getPagination(req);
  const userId = req.user?.user_id || null;

  const post = await pool.query(
    `SELECT ${postSelect(true).replace("$USER_ID", "$2")}
     FROM posts p
     JOIN users u ON u.user_id = p.user_id
     WHERE p.post_id=$1`,
    [req.params.postId, userId],
  );

  if (!post.rowCount) return res.status(404).json({ error: "Post not found" });

  const replies = await pool.query(
    `
    SELECT ${postSelect(true).replace("$USER_ID", "$2")}
    FROM posts p
    JOIN users u ON u.user_id = p.user_id
    WHERE p.parent_id=$1
    ORDER BY p.created_at ASC
    LIMIT $3 OFFSET $4
    `,
    [req.params.postId, userId, limit, offset],
  );

  res.json({
    post: post.rows[0],
    replies: replies.rows,
    pagination: { limit, offset },
  });
});

//
// User Profile Posts (Top-Level Only)
//
export const getUserPosts = asyncHandler(async (req, res) => {
  const { limit, offset } = getPagination(req);
  const viewerId = req.user?.user_id || null;

  const result = await pool.query(
    `
    SELECT ${postSelect(true).replace("$USER_ID", "$2")}
    FROM posts p
    JOIN users u ON u.user_id = p.user_id
    WHERE p.user_id=$1 AND p.parent_id IS NULL
    ORDER BY p.created_at DESC
    LIMIT $3 OFFSET $4
    `,
    [req.params.userId, viewerId, limit, offset],
  );

  res.json(result.rows);
});

//
// Delete Own Post
//
export const deletePost = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `DELETE FROM posts WHERE post_id=$1 AND user_id=$2 RETURNING post_id`,
    [req.params.postId, req.user.user_id],
  );

  if (!result.rowCount)
    return res.status(404).json({ error: "Post not found or not authorized" });

  res.json({ message: "Post deleted" });
});