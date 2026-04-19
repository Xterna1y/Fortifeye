import * as authService from "./auth.service.js";

export const login = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await authService.login(email);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};