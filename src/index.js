import express from "express";
import config from "./config/index.js";
import cors from "cors";
import rootRouter from "./routes/index.js";
import { PrismaClient } from "@prisma/client";
import { errorHandler, routeNotFound } from "./middlewares/index.js";
import log from "./utils/logger.js";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Manually define __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.PORT || 5000;

const SRC_DIR = __dirname; // This should be your src directory
const UPLOADS_DIR = path.join(SRC_DIR, "uploads");

log.info(`Source directory: ${SRC_DIR}`);
log.info(`Upload directory will be created at: ${UPLOADS_DIR}`);

if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    log.info(`Successfully created uploads directory at: ${UPLOADS_DIR}`);
  } catch (err) {
    log.error(`Failed to create uploads directory: ${err.message}`);
  }
}

// Export the UPLOADS_DIR constant
export { UPLOADS_DIR };
// // Create the uploads directory inside the src folder
// // const UPLOADS_DIR = path.join(__dirname, "uploads");
// if (!fs.existsSync(UPLOADS_DIR)) {
//   fs.mkdirSync(UPLOADS_DIR, { recursive: true });
// }

// // Export UPLOADS_DIR for use in route files
// export { UPLOADS_DIR };

// Middleware setup - order matters!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  })
);
app.use(cors());

// Static file serving - make sure this is before routes
// app.use("/", express.static(UPLOADS_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));

// Logging middleware
app.use((req, res, next) => {
  log.info(
    {
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
    "Incoming request"
  );
  next();
});

// Root route
app.get("/api/v1", (req, res) => {
  res.json({
    status: "success",
    message:
      "Welcome to HR management system: I will be responding to your requests",
  });
});

// API routes
app.use("/api/v1", rootRouter);

// Database client
export const prismaClient = new PrismaClient({
  log: ["query"],
});

// Error handling middleware - must be after routes
app.use(errorHandler);
app.use(routeNotFound);

// Start the server
app.listen(port, () => {
  log.info(`Server is listening on port ${port}`);
  log.info(`Upload directory: ${UPLOADS_DIR}`);
  log.info(`Files will be accessible at: http://localhost:${port}/uploads/`);
});

export default app;
