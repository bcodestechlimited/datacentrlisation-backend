import { Router } from "express";
import { validateData } from "../middlewares/validation.js";

import { AuthSchema } from "../schema/auth.schema.js";
import { login, register, logout } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
const authRouter = Router();

authRouter.post("/register", validateData(AuthSchema), register);
authRouter.post("/login", validateData(AuthSchema), login);
authRouter.post("/logout", authMiddleware, logout);

export { authRouter };
