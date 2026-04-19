import * as authService from "./auth.service.js";

export const login = (req, res) => {
  const { email } = req.body;

  const user = authService.login(email);

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  res.json(user);
};