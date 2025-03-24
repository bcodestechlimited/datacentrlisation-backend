import config from "../config/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

async function generateAccessToken(userId) {
  return jwt.sign({ userId }, config.TOKEN_SECRET, {
    expiresIn: config.TOKEN_EXPIRY,
  });
}

const generateNumericOTP = (length) => {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 9 + 1).toString();
  }
  return otp;
};

export {
  generateNumericOTP,
  hashPassword,
  comparePassword,
  generateAccessToken,
};
