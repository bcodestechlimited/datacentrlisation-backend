import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { authenticateToken, authorizeRole } from "../middlewares/userauth.js";

const prisma = new PrismaClient();
const BusinessAdvisorySBU = express.Router();

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["employee1", "employee2", "employee3"]),
});

// Zod schema for creating a WeeklyIncome entry
const createWeeklyIncomeSchema = z.object({
  weekNumber: z.number().int().positive(),
  income: z.number().positive(),
  month: z.string().min(1),
  year: z.number().int().positive(),
  description: z.string().optional(),
  userId: z.string().uuid(), // Ensure userId is a valid UUID
});

// Zod schema for updating a WeeklyIncome entry
const updateWeeklyIncomeSchema = z.object({
  weekNumber: z.number().int().positive().optional(),
  income: z.number().positive().optional(),
  month: z.string().min(1).optional(),
  year: z.number().int().positive().optional(),
  description: z.string().optional(),
  userId: z.string().uuid().optional(), // Ensure userId is a valid UUID
});

// Zod schema for creating an edit log entry
const createEditLogSchema = z.object({
  editedById: z.string().uuid(), // Ensure editedById is a valid UUID
  oldIncome: z.number().positive(),
  newIncome: z.number().positive(),
});

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  userId: z.string().uuid(), // Ensure userId is a valid UUID
});

// Zod schema for updating a client
const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  userId: z.string().uuid().optional(), // Ensure userId is a valid UUID
});

const createHotProspectSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  email: z.string().email(),
  status: z.string().optional(),
  value: z.coerce.number().positive(),
  userId: z.string().uuid(), // Ensure userId is a valid UUID
});

// Zod schema for updating a hot prospect
const updateHotProspectSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  email: z.string().email().optional(),
  status: z.string().optional(),
  value: z.coerce.number().positive().optional(),
  userId: z.string().uuid().optional(),
});

// Create User
BusinessAdvisorySBU.post(
  "/users",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const { email, password, role } = userSchema.parse(req.body);

      const admin = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!admin || !admin.departmentId) {
        return res
          .status(403)
          .json({ message: "Unauthorized or no department assigned" });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          password: password,
          role,
          departmentId: admin.departmentId,
        },
      });

      res.status(201).json({
        message: "User created successfully",
        data: newUser, // { email, password, role },
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get All Users
// BusinessAdvisorySBU.get("/users", authenticateToken, async (req, res) => {
//   try {
//     const users = await prisma.user.findMany();
//     res.status(200).json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Get All Users in the Same Department
BusinessAdvisorySBU.get("/users", authenticateToken, async (req, res) => {
  try {
    // Fetch the authenticated admin user
    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!admin || !admin.departmentId) {
      return res
        .status(403)
        .json({ message: "Unauthorized or no department assigned" });
    }

    // Fetch users in the same department
    const users = await prisma.user.findMany({
      where: { departmentId: admin.departmentId },
    });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User
BusinessAdvisorySBU.put(
  "/users/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { email, role } = req.body;

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { email, role },
      });

      res
        .status(200)
        .json({ message: "User updated successfully", data: user });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Delete User
BusinessAdvisorySBU.delete(
  "/users/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// weeklyIncome

BusinessAdvisorySBU.get(
  "/weekly-income",
  authenticateToken,
  async (req, res) => {
    try {
      // Fetch the authenticated admin user
      const admin = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      const weeklyIncomes = await prisma.weeklyIncome.findMany();
      res.status(200).json(weeklyIncomes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

BusinessAdvisorySBU.post(
  "/weekly-income",
  authenticateToken,
  async (req, res) => {
    try {
      // Fetch the authenticated admin user
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      let { weekNumber, income, month, year, description } = req.body;

      const validatedData = createWeeklyIncomeSchema.parse({
        weekNumber,
        income,
        month,
        year,
        description,
        userId: user?.id,
      });

      const newWeeklyIncome = await prisma.weeklyIncome.create({
        data: validatedData,
      });

      // const weeklyIncomes = await prisma.weeklyIncome.findMany();
      res.status(200).json({
        newWeeklyIncome,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

BusinessAdvisorySBU.patch(
  "/weekly-income/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      // Fetch the authenticated admin user
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      let { income, description } = req.body;

      const validatedData = updateWeeklyIncomeSchema.parse({
        income,
        description,
        userId: user?.id,
      });

      const currentIncome = await prisma.weeklyIncome.findUnique({
        where: { id },
        select: { income: true },
      });

      if (!currentIncome) {
        return res.status(404).json({ error: "WeeklyIncome not found" });
      }

      // Update the WeeklyIncome entry
      const updatedWeeklyIncome = await prisma.weeklyIncome.update({
        where: { id },
        data: validatedData,
      });

      // Create an edit log if the income was updated
      if (validatedData.income !== undefined) {
        await prisma.weeklyIncomeEditLog.create({
          data: {
            weeklyIncomeId: id,
            editedById: validatedData.userId || updatedWeeklyIncome.userId, // Use the provided userId or the existing one
            oldIncome: currentIncome.income,
            newIncome: validatedData.income,
          },
        });
      }
      res.status(200).json(updatedWeeklyIncome);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

BusinessAdvisorySBU.delete(
  "/weekly-income/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      // Fetch the authenticated admin user
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      await prisma.weeklyIncome.delete({
        where: { id },
      });

      // const weeklyIncomes = await prisma.weeklyIncome.findMany();
      res.status(200).json({
        data: "data has been deleted",
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

BusinessAdvisorySBU.get("/clients", authenticateToken, async (req, res) => {
  try {
    // Fetch the authenticated admin user
    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    const clients = await prisma.client.findMany();
    res.status(200).json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

BusinessAdvisorySBU.post("/clients", authenticateToken, async (req, res) => {
  try {
    // Fetch the authenticated admin user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    let { name, email } = req.body;

    const validatedData = createClientSchema.parse({
      name,
      email,
      userId: user?.id,
    });

    const newClient = await prisma.client.create({
      data: validatedData,
    });

    // const weeklyIncomes = await prisma.weeklyIncome.findMany();
    res.status(200).json({
      newClient,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

BusinessAdvisorySBU.put("/clients/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the authenticated admin user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    let { name, email, value, status } = req.body;

    // Validate the input data
    const validatedData = updateClientSchema.parse({
      name,
      email,
      value,
      status,
      userId: user?.id,
    });

    // Remove empty string fields from the update data
    const updateData = {};
    if (validatedData.name && validatedData.name.trim() !== "") {
      updateData.name = validatedData.name;
    }
    if (validatedData.email && validatedData.email.trim() !== "") {
      updateData.email = validatedData.email;
    }

    // Update the client only if there are valid fields to update
    if (Object.keys(updateData).length > 0) {
      const updatedClient = await prisma.client.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json(updatedClient);
    } else {
      res.status(400).json({ error: "No valid fields to update" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

BusinessAdvisorySBU.delete(
  "/clients/:id",
  authenticateToken,
  async (req, res) => {
    try {
      // Fetch the authenticated admin user
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      const { id } = req.params;

      await prisma.client.delete({
        where: { id },
      });

      // const weeklyIncomes = await prisma.weeklyIncome.findMany();
      res.status(200).json({
        data: "item deleted",
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

BusinessAdvisorySBU.post(
  "/hot-prospects",
  authenticateToken,
  async (req, res) => {
    try {
      // Fetch the authenticated admin user
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      let { name, email, value } = req.body;

      const validatedData = createHotProspectSchema.parse({
        name,
        email,
        userId: user?.id,
        status: "Pending",
        value: parseFloat(value),
      });

      const newHotProspect = await prisma.hotProspect.create({
        data: validatedData,
      });

      res.status(201).json(newHotProspect);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

BusinessAdvisorySBU.get(
  "/hot-prospects",
  authenticateToken,
  async (req, res) => {
    try {
      // Fetch the authenticated admin user
      const admin = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      const hotProspects = await prisma.hotProspect.findMany();
      res.status(200).json(hotProspects);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

BusinessAdvisorySBU.put(
  "/hot-prospects/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      let { name, email, value } = req.body;

      const validatedData = updateHotProspectSchema.parse(req.body);

      // Remove empty string fields from the update data
      const updateData = {};
      if (validatedData.name && validatedData.name.trim() !== "") {
        updateData.name = validatedData.name;
      }
      if (validatedData.email && validatedData.email.trim() !== "") {
        updateData.email = validatedData.email;
      }
      if (validatedData.status && validatedData.status.trim() !== "") {
        updateData.status = validatedData.status;
      }
      if (validatedData.value !== undefined) {
        updateData.value = validatedData.value;
      }
      if (validatedData.userId) {
        updateData.userId = validatedData.userId;
      }

      // Update the hot prospect only if there are valid fields to update
      if (Object.keys(updateData).length > 0) {
        const updatedHotProspect = await prisma.hotProspect.update({
          where: { id },
          data: updateData,
        });

        res.status(200).json(updatedHotProspect);
      } else {
        res.status(400).json({ error: "No valid fields to update" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

BusinessAdvisorySBU.delete(
  "/hot-prospects/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      const { id } = req.params;

      await prisma.hotProspect.delete({
        where: { id },
      });

      res.status(200).json({
        data: "item deleted",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
export { BusinessAdvisorySBU };
