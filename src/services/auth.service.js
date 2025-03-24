import config from "../config/index.js";
import { prismaClient } from "../index.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
} from "../utils/index.js";
import {
  Conflict,
  ResourceNotFound,
  Unauthorised,
} from "../middlewares/error.js";

export class AuthService {
  async register(payload) {
    const { email, password } = payload;
    const hashedPassword = await hashPassword(password);
    let user = await prismaClient.user.findFirst({ where: { email } });
    if (user) {
      throw new Conflict("User already exists");
    }

    const newUser = await prismaClient.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return {
      data: newUser,
      message: "User Created Successfully.",
    };
  }

  async login(payload) {
    const { email, password } = payload;
    const userExist = await prismaClient.user.findFirst({ where: { email } });

    if (!userExist) {
      throw new ResourceNotFound("Authentication failed");
    }
    const isPassword = await comparePassword(password, userExist.password);
    if (!isPassword) {
      throw new ResourceNotFound("Authentication failed");
    }

    const accessToken = await generateAccessToken(userExist.id);
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + parseInt(config.TOKEN_EXPIRY.replace("d", ""), 10)
    );
    
    await prismaClient.session.upsert({
      where: { userId: userExist.id },
      update: { sessionToken: accessToken, expiresAt },
      create: { userId: userExist.id, sessionToken: accessToken, expiresAt },
    });

    const user = {
      email: userExist.email,
      role: userExist.role,
    };
    return {
      message: "Login Successfully",
      user,
      token: accessToken,
    };
  }

  async logout(userId, token) {
    await prismaClient.session.delete({
      where: { userId, sessionToken: token },
    });

    return {
      message: "Logout sucessful",
    };
  }
}
