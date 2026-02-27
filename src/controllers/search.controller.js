import { pool } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const searchAll = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) {
    return res.status(400).json({ error: "Search query required" });
  }

  // convert multiple contiguous whitespace to a single ampersand term
  // but rely on PostgreSQL's plainto_tsquery to safely escape special
  // characters and handle stemming.  We still collapse blanks so that
  // "foo   bar" becomes "foo & bar" rather than "foo &&& bar".
  const searchTerm = q
    .split(/\s+/)
    .filter(Boolean)
    .join(" & ");

  // allow callers to bump the limit but cap it to avoid abuse
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const postsPromise = pool.query(
    `
    SELECT
      p.post_id,
      p.content,
      p.likes_count,
      p.replies_count,
      p.created_at,
      u.username
    FROM posts p
    JOIN users u ON u.user_id = p.user_id
    WHERE to_tsvector('simple', p.content)
          @@ plainto_tsquery('simple', $1)
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [searchTerm, limit],
  );

  const usersPromise = pool.query(
    `
    SELECT user_id, username
    FROM users
    WHERE to_tsvector('simple', username)
          @@ plainto_tsquery('simple', $1)
    LIMIT $2
    `,
    [searchTerm, limit],
  );

  const [posts, users] = await Promise.all([postsPromise, usersPromise]);

  res.json({
    posts: posts.rows,
    users: users.rows,
    pagination: { limit },
  });
});