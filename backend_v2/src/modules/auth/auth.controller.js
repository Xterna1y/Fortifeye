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

export const register = async (req, res) => {
  try {
    const { email, name, role, identity } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // You can customize the user fields you want to save
    const userData = {
      email,
      name: name || "New User",
      role: role || "user",
      identity: identity || "na"
    };

    const newUser = await authService.register(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.message === "User with this email already exists") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};