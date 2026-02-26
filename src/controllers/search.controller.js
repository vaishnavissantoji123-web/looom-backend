import { pool } from "../db.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const searchAll = asyncHandler(async (req, res) => {
    const q = req.query.q?.trim();
    if (!q) {
        return res.status(400).json({ error: "search query required" })
    }
    const searchTerm = q.split("").join("&")
    const postPromise = pool.query(
        `SELECT p.post_id,
        p.content,
        p.likes_count,
        p.replies_count,
        p.created_at,
        u.username
        FROM posts p JOIN users u ON 
        u.user_id=p.user_id
        WHERE to_tsvector('simple',p.content) @@ to_tsquery('simple',$1) ORDER BY created_at DESC LIMIT 10`,
        [searchTerm]
    )


    const userPromise = pool.query(
        `SELECT user_id,username FROM users
        WHERE to_tsvector('simple',username) @@ to_tsquery('simple',$1) LIMIT 10`,
        [searchTerm]
    )

    const [posts, users] = await Promise.all([postPromise, userPromise])
    res.json({
        posts: posts.rows,
        users: users.rows
    })


})