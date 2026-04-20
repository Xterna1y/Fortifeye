import * as authService from "./auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await authService.login(email, password);

    if (!result.ok) {
      if (result.code === "USER_NOT_FOUND") {
        return res.status(401).json({ message: "User not found" });
      }

      if (result.code === "INVALID_PASSWORD") {
        return res.status(401).json({ message: "Incorrect password" });
      }

      if (result.code === "PASSWORD_NOT_SET") {
        return res.status(400).json({
          message:
            "This account was created before password authentication was enabled. Please create a new account or reset this user manually.",
        });
      }

      return res.status(401).json({ message: "User not found" });
    }

    res.json(result.user);
  } catch (error) {
    console.error("Error logging in:", error);
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

export const register = async (req, res) => {
  try {
    const { email, password, name, role, identity } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // You can customize the user fields you want to save
    const userData = {
      email,
      password,
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
