import express from "express";
import { login, register, getProfile, updateProfile, updatePassword } from "./auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/profile/:userId", getProfile);
router.patch("/profile/:userId", updateProfile);
router.patch("/profile/:userId/password", updatePassword);

export default router;
