export function checkSuspension(req: any, res: any, next: any) {
  if (req.user.is_suspended) {
    return res.status(403).send("Account suspended");
  }
  next();
}