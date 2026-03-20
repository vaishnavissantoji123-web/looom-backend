import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) return res.sendStatus(401);

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains user_id
    next();
  } catch {
    res.sendStatus(403);
  }
}

export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) return next();

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // ignore invalid tokens silently
  }

  next();
};