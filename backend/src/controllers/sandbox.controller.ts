import { Request, Response } from "express";
import { sandboxBrowse } from "../services/sandbox.service";

export const openSandbox = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL required" });
    }

    const content = await sandboxBrowse(url);

    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ error: "Sandbox failed" });
  }
};