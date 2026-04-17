import express from "express";
import sandboxRoutes from "./routes/sandbox.routes";
import guardianRoutes from "./routes/guardian.routes";

const app = express();

app.use(express.json());

app.use("/api/sandbox", sandboxRoutes);
app.use("/api/guardian", guardianRoutes);

app.get("/test", (req, res) => {
  res.json({ message: "API is working ✅" });
});

export default app;