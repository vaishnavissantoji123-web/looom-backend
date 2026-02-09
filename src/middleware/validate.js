export const requireFields = (fields) => (req, res, next) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body is required" });
  }

  for (const field of fields) {
    if (req.body[field] === undefined || req.body[field] === "") {
      return res.status(400).json({ error: `'${field}' field is required` });
    }
  }

  next();
};