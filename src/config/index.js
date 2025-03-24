import { configDotenv } from "dotenv";
// dotenv.config();
configDotenv();

const config = {
  PORT: process.env.PORT ?? 8000,
  NODE_ENV: process.env.NODE_ENV,
  TOKEN_SECRET: process.env.AUTH_SECRET,
  TOKEN_EXPIRY: process.env.AUTH_EXPIRY,
  GOOGLE_USER: process.env.GOOGLE_USER,
  GOOGLE_SENDER_MAIL: process.env.GOOGLE_SENDER_MAIL,
  GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD,
};

export default config;
