import * as authService from "./auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await authService.login(email, password);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error logging in:", error);
    if (error.message === "Invalid email or password") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await authService.getProfile(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: "At least one profile field is required" });
    }

    const user = await authService.updateProfile(userId, { name, email });
    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error.message === "User not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "User with this email already exists") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await authService.updatePassword(userId, currentPassword, newPassword);
    res.json(user);
  } catch (error) {
    console.error("Error updating password:", error);
    if (error.message === "User not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Current password is incorrect" || error.message === "Password cannot be empty") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { email, name, role, identity, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // You can customize the user fields you want to save
    const userData = {
      email,
      name: name || "New User",
      role: role || "user",
      identity: identity || "na",
      password,
    };

    const newUser = await authService.register(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.message === "User with this email already exists") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "Password cannot be empty") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
