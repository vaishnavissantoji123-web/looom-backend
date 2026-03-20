export function errorHandler(err, req, res, next) {
  console.error("ERROR:", err);

  // PostgreSQL duplicate key
  if (err.code === "23505") {
    return res.status(400).json({ error: "Duplicate value" });
  }

  // PostgreSQL UUID format error
  if (err.code === "22P02") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  res.status(500).json({ error: "Internal Server Error" });
}