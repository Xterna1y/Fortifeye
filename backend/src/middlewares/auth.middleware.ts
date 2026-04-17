import jwt from "jsonwebtoken";

export function verifyToken(req: any, res: any, next: any) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).send("Unauthorized");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}