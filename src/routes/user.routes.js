import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
// import { comparePassword } from "../utils";
import config from "../config/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken, authorizeRole } from "../middlewares/userauth.js";
// import { comparePassword } from "../utils";
const prisma = new PrismaClient();
const userrouter = express.Router();
// const employeeRouter = Router();

// Zod Validation Schemas
const departmentSchema = z.object({
  name: z.string().min(3),
});

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // departmentId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
async function generateAccessToken(userId) {
  return jwt.sign({ userId }, config.TOKEN_SECRET, {
    expiresIn: config.TOKEN_EXPIRY,
  });
}

// Login Route
userrouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    loginSchema.parse({ email, password });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: true, // Include the department details
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const accessToken = await generateAccessToken(user.id);
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + parseInt(config.TOKEN_EXPIRY.replace("d", ""), 10)
    );

    res.status(200).json({
      message: "Login successful",
      data: {
        user,
        token: accessToken,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// import { authenticateToken, authorizeRole } from "./middlewares/authMiddleware.js";

userrouter.get(
  "/admin-only",
  authenticateToken,
  // authorizeRole(["admin", "superadmin"]),
  authorizeRole(["empl"]),
  (req, res) => {
    res.json({ message: "Welcome Admin!", user: req.user });
  }
);

userrouter.post("/users/admin", async (req, res) => {
  try {
    const validatedData = userSchema.parse(req.body);
    const admin = await prisma.user.create({
      data: {
        ...validatedData,
        role: "admin",
      },
    });
    res.status(201).json(admin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create Superadmin (Hardcoded Route)
userrouter.post("/superadmin", async (req, res) => {
  try {
    const superadmin = await prisma.user.create({
      data: {
        email: "superadmin@icsqct.com",
        password: "password123",
        role: Role.superadmin, // ✅ This is the correct way
      },
    });

    res.status(201).json(superadmin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create Department
userrouter.post("/departments", async (req, res) => {
  try {
    const validatedData = departmentSchema.parse(req.body);
    const department = await prisma.department.create({
      data: validatedData,
    });
    res.status(201).json(department);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List Departments
userrouter.get(
  "/departments",
  authenticateToken,
  authorizeRole(["admin", "superadmin"]),
  async (req, res) => {
    const departments = await prisma.department.findMany();
    res.json(departments);
  }
);

// Create Admin User
userrouter.post("/users/admin", async (req, res) => {
  try {
    const validatedData = userSchema.parse(req.body);
    const admin = await prisma.user.create({
      data: {
        ...validatedData,
        role: "admin",
      },
    });
    res.status(201).json(admin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

userrouter.get("/admin", async (req, res) => {
  try {
    // Fetch users with the role "admin"
    const adminUsers = await prisma.user.findMany({
      where: {
        role: "admin", // Filter by role
      },
    });

    res.json(adminUsers);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// List Users
userrouter.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Delete User
userrouter.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export { userrouter };
