// schemas.js
import express from "express";
import { z } from "zod";
// import { authenticateToken, authorizeRole } from "../middlewares/userauth.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Prisma, PrismaClient } from "@prisma/client";
import { authenticateToken } from "../../middlewares/userauth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go up one directory to src from routes folder
const SRC_DIR = path.resolve(__dirname, "../");
const UPLOADS_DIR = path.join(SRC_DIR, "uploads");

// Ensure the directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`Created uploads directory at: ${UPLOADS_DIR}`);
}

console.log(`Fleet routes using uploads directory: ${UPLOADS_DIR}`);

const prisma = new PrismaClient();
const sharedadminRouter = express.Router();

// Vendor Schema
const vendorSchema = z.object({
  vendorId: z.string().min(3),
  vendorName: z.string().min(3),
  serviceProvided: z.string().min(3),
  contactPerson: z.string().min(3),
  phoneNumber: z.string().min(10),
  email: z.string().email(),
  businessAddress: z.string().min(5),
  status: z.enum(["Registered", "Pending", "Approved"]),
});

// Storeroom Stock Schema
const storeroomStockSchema = z.object({
  stockId: z.string().min(3),
  itemName: z.string().min(3),
  category: z.string().min(3),
  quantity: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
  lastRestocked: z.date(),
});

// Facility Schema
const facilitySchema = z.object({
  facilityId: z.string().min(3),
  facilityName: z.string().min(3),
  location: z.string().min(3),
  assignedVendor: z.string().min(3),
  maintenanceStatus: z.enum(["Active", "Due", "Under Repair"]),
  lastMaintenance: z.date(),
});

// Janitorial Supply Schema
const janitorialSupplySchema = z.object({
  itemId: z.string().min(3),
  itemName: z.string().min(3),
  category: z.enum(["Cleaning Agents", "Disinfectants", "Equipment"]),
  quantity: z.number().int().nonnegative(),
  distributionDate: z.date(),
  recipient: z.string().min(3),
});

// Bill Schema
const billSchema = z.object({
  billId: z.string().min(3),
  serviceProvider: z.string().min(3),
  billType: z.enum(["Utility", "Subscription", "Internet", "Tax", "Other"]),
  amount: z.number().nonnegative(),
  dueDate: z.date(),
  paymentStatus: z.enum(["Paid", "Pending", "Overdue"]),
});

// HSE Report Schema
const hseReportSchema = z.object({
  reportId: z.string().min(3),
  incidentType: z.enum(["Accident", "Safety Violation", "Near Miss"]),
  dateOfIncident: z.date(),
  location: z.string().min(3),
  personsInvolved: z.string().min(3),
  correctiveAction: z.string().min(3),
});

// Admin Monthly Report Schema
const adminMonthlyReportSchema = z.object({
  reportId: z.string().min(3),
  monthYear: z.string().regex(/^(0[1-9]|1[0-2])\/\d{4}$/),
  keyActivities: z.string().min(10),
  performanceSummary: z.string().min(10),
  budgetExpenses: z.string().min(10),
  challenges: z.string().min(10),
});

// Onboarded Staff Schema
const onboardedStaffSchema = z.object({
  staffId: z.string().min(3),
  fullName: z.string().min(3),
  resumptionForm: z.string().min(3),
  bankAccountDetails: z.object({
    accountNumber: z.string().min(10),
    bankName: z.string().min(3),
  }),
  bvn: z.string().min(11).max(11),
  pfaDetails: z.object({
    pfaName: z.string().min(3),
    rsaNumber: z.string().min(3),
  }),
  officialEmail: z.string().email(),
  officialPhone: z.string().min(10),
  emergencyContact: z.object({
    name: z.string().min(3),
    relationship: z.string().min(3),
    phone: z.string().min(10),
  }),
  userId: z.string().min(3),
});

// const express = require('express');
// const { PrismaClient } = require('@prisma/client');
// const { vendorSchema } = require('../schemas');

// const prisma = new PrismaClient();
// const router = express.Router();

// Create Vendor

export const handleErrorResponse = (error, res) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: error.errors,
    });
  }
  console.error(error);
  res.status(500).json({ error: error.message || "Internal server error" });
};

sharedadminRouter.post("/vendor", authenticateToken, async (req, res) => {
  try {
    const validatedData = vendorSchema.parse(req.body);
    const vendor = await prisma.Shared_Services_Admin_Vendor.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });
    res.status(201).json(vendor);
  } catch (error) {
    handleErrorResponse(error, res);

    // res.status(400).json({ error: error.message });
  }
});

// Get All Vendors
sharedadminRouter.get("/vendor", authenticateToken, async (req, res) => {
  try {
    const vendors = await prisma.Shared_Services_Admin_Vendor.findMany();
    res.json(vendors);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Update Vendor
sharedadminRouter.put("/vendor/:id", authenticateToken, async (req, res) => {
  try {
    const validatedData = vendorSchema.parse(req.body);
    const vendor = await prisma.Shared_Services_Admin_Vendor.update({
      where: { id: req.params.id },
      data: validatedData,
    });
    res.json(vendor);
  } catch (error) {
    handleErrorResponse(error, res);

    // res.status(400).json({ error: error.message });
  }
});

// Delete Vendor
sharedadminRouter.delete("/vendor/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.Shared_Services_Admin_Vendor.delete({
      where: { id: req.params.id },
    });
    res.status(204).end();
  } catch (error) {
    // res.status(500).json({ error: error.message });
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.post(
  "/StoreroomStock",
  authenticateToken,
  async (req, res) => {
    try {
      const parsedData = {
        ...req.body,
        lastRestocked: new Date(req.body.lastRestocked), // Convert string to Date
      };

      const validatedData = storeroomStockSchema.parse(parsedData);

      const stockItem = await prisma.ssadminstoreroom.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json(stockItem);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

sharedadminRouter.get(
  "/StoreroomStock",
  authenticateToken,
  async (req, res) => {
    try {
      const stockItems = await prisma.ssadminstoreroom.findMany({});
      res.json(stockItems);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

sharedadminRouter.put(
  "/StoreroomStock/:id",
  authenticateToken,
  async (req, res) => {
    try {
      // const validatedData = storeroomStockSchema.parse(req.body);

      const parsedData = {
        ...req.body,
        lastRestocked: new Date(req.body.lastRestocked), // Convert string to Date
      };

      const validatedData = storeroomStockSchema.parse(parsedData);

      const stockItem = await prisma.ssadminstoreroom.update({
        where: { id: req.params.id },
        data: validatedData,
      });
      res.json(stockItem);
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Stock item not found" });
      }
      handleErrorResponse(error, res);
    }
  }
);

sharedadminRouter.delete(
  "/StoreroomStock/:id",
  authenticateToken,
  async (req, res) => {
    try {
      await prisma.ssadminstoreroom.delete({
        where: { id: req.params.id },
      });
      res.status(204).end();
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

sharedadminRouter.post("/Facility", authenticateToken, async (req, res) => {
  try {
    const parsedData = {
      ...req.body,
      lastMaintenance: new Date(req.body.lastMaintenance), // Convert string to Date
    };

    const validatedData = facilitySchema.parse(parsedData);

    const facility = await prisma.ssadminFacility.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });
    res.status(201).json(facility);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.get("/Facility", authenticateToken, async (req, res) => {
  try {
    const facilities = await prisma.ssadminFacility.findMany({
      // where,
      // orderBy: { facilityName: "asc" },
    });
    res.status(201).json(facilities);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.put("/Facility/:id", authenticateToken, async (req, res) => {
  try {
    const parsedData = {
      ...req.body,
      lastMaintenance: new Date(req.body.lastMaintenance), // Convert string to Date
    };

    const validatedData = facilitySchema.parse(parsedData);

    const facility = await prisma.ssadminFacility.update({
      where: { id: req.params.id },
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });
    res.json(facility);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Facility not found" });
    }
    res.status(400).json({ error: error.message });
  }
});

sharedadminRouter.delete(
  "/Facility/:id",
  authenticateToken,
  async (req, res) => {
    try {
      await prisma.ssadminFacility.delete({
        where: { id: req.params.id },
      });
      res.status(204).end();
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Facility not found" });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

sharedadminRouter.post("/Janitorial", authenticateToken, async (req, res) => {
  try {
    const parsedData = {
      ...req.body,
      distributionDate: new Date(req.body.distributionDate), // Convert string to Date
    };
    const validatedData = janitorialSupplySchema.parse(parsedData);
    const janitorialItem = await prisma.ssadminJanitorialSupply.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });
    res.status(201).json(janitorialItem);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.put(
  "/Janitorial/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const parsedData = {
        ...req.body,
        distributionDate: new Date(req.body.distributionDate), // Convert string to Date
      };
      const validatedData = janitorialSupplySchema.parse(parsedData);
      const janitorialItem = await prisma.ssadminJanitorialSupply.update({
        where: { id: req.params.id },
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });
      res.status(201).json(janitorialItem);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

sharedadminRouter.delete(
  "/Janitorial/:id",
  authenticateToken,
  async (req, res) => {
    try {
      await prisma.ssadminJanitorialSupply.delete({
        where: { id: req.params.id },
      });
      res.status(204).end();
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Janitorial item not found" });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

sharedadminRouter.get("/Janitorial", authenticateToken, async (req, res) => {
  try {
    const janitorialItems = await prisma.ssadminJanitorialSupply.findMany({});
    res.status(201).json(janitorialItems);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.post("/bill", authenticateToken, async (req, res) => {
  try {
    const parsedData = {
      ...req.body,
      dueDate: new Date(req.body.dueDate), // Convert string to Date
    };
    const validatedData = billSchema.parse(parsedData);
    const bill = await prisma.ssadminBill.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });
    res.status(201).json(bill);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.get("/bill", authenticateToken, async (req, res) => {
  try {
    const bills = await prisma.ssadminBill.findMany({});
    res.status(201).json(bills);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.put("/bill/:id", authenticateToken, async (req, res) => {
  try {
    const parsedData = {
      ...req.body,
      dueDate: new Date(req.body.dueDate), // Convert string to Date
    };
    const validatedData = billSchema.parse(parsedData);
    const BillItem = await prisma.ssadminBill.update({
      where: { id: req.params.id },
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });
    res.status(201).json(BillItem);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.delete("/bill/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.ssadminBill.delete({
      where: { id: req.params.id },
    });
    res.status(204).end();
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.post("/hse", authenticateToken, async (req, res) => {
  try {
    const parsedData = {
      ...req.body,
      dateOfIncident: new Date(req.body.dateOfIncident), // Convert string to Date
    };
    const validatedData = hseReportSchema.parse(parsedData);
    const HSE = await prisma.ssadminHSEReport.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });
    res.status(201).json(HSE);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.get("/hse", authenticateToken, async (req, res) => {
  try {
    const HSE = await prisma.ssadminHSEReport.findMany({});

    res.status(201).json(HSE);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.put("/hse/:id", authenticateToken, async (req, res) => {
  try {
    const parsedData = {
      ...req.body,
      dateOfIncident: new Date(req.body.dateOfIncident), // Convert string to Date
    };
    const validatedData = hseReportSchema.parse(parsedData);
    const HSE = await prisma.ssadminHSEReport.update({
      where: { id: req.params.id },
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });
    res.status(201).json(HSE);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

sharedadminRouter.delete("/hse/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.ssadminHSEReport.delete({
      where: { id: req.params.id },
    });
    res.status(204).end();
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

export { sharedadminRouter };
