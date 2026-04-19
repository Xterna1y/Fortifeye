import app from "./src/app.js";
import { PORT } from "./src/config/env.js";

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use!`);
    console.error(`Run this to fix it:  netstat -ano | findstr :${PORT}  then  taskkill /PID <PID> /F\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

// Graceful shutdown
const shutdown = () => {
  server.close(() => {
    console.log("Server closed cleanly.");
    process.exit(0);
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
