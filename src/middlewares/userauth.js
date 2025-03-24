// authMiddleware.js
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }

  jwt.verify(token, config.TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }
    req.user = user;
    next();
  });
}

function authorizeRole(roles) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;

      //   console.log({
      //     jgjg: userId,
      //   });

      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      //   Fetch user by ID from the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the user's role is in the allowed roles
      if (!roles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Access Denied: Unauthorized Role" });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}

function authorizeDepartment(roles) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found in token" });
      }

      // Fetch user by ID from the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the user's role is in the allowed roles
      if (!roles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Access Denied: Unauthorized Role" });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}

export { authenticateToken, authorizeRole };
