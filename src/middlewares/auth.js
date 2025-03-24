import jwt from "jsonwebtoken";
import config from "../config/index.js";
import log from "../utils/logger.js";
import { ServerError } from "./error.js";
import { prismaClient } from "../index.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status_code: "401",
        message: "Invalid token ",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        status_code: "401",
        message: "Invalid token ",
      });
      return;
    }

    jwt.verify(token, config.TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        res.status(401).json({
          status_code: "401",
          message: "Invalid token",
        });
        return;
      }
      const session = await prismaClient.session.findFirst({
        where: { sessionToken: token },
      });
      if (!session || new Date() > session.expiresAt) {
        return res.status(401).json({
          status_code: "401",
          message: "Session expired or invalid",
        });
      }
      const user = await prismaClient.user.findFirst({
        where: { id: decoded["userId"] },
      });
      if (!user) {
        res.status(401).json({
          status_code: "401",
          message: "Invalid token",
        });
        return;
      }
      req.user = user;
      next();
    });
  } catch (error) {
    log.error(error);
    throw new ServerError("INTERNAL_SERVER_ERROR");
  }
};
export const adminMiddleware = async (req, res, next) => {
  const user = req.user;
  if (user?.role === "admin") {
    next();
  } else {
    res.status(403).json({
      status_code: "403",
      message: "Unauthorized",
    });
    return;
  }
};
