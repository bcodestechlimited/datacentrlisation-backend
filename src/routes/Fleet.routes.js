import express from "express";
import { z } from "zod";
import { authenticateToken, authorizeRole } from "../middlewares/userauth.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Prisma, PrismaClient } from "@prisma/client";

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
const FleetRouter = express.Router();

const fleetFuelingSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  vehicleType: z.string().min(1, "Vehicle Type is required"),
  driverName: z.string().min(1, "Driver Name is required"),
  fuelingDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  litersPurchased: z.number().positive("Liters purchased must be positive"),
  totalFuelCost: z.number().positive("Total fuel cost must be positive"),
});

const fleetRepairsSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  vehicleType: z.string().min(1, "Vehicle Type is required"),
  repairDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  workshopName: z.string().min(1, "Workshop Name is required"),
  description: z.string().min(1, "Description is required"),
  partsReplaced: z.array(z.string()),
  repairCost: z.number().positive("Repair cost must be positive"),
  paymentStatus: z.enum(["Pending", "Paid", "Overdue"]),
  approvedBy: z.string().min(1, "Approved By is required"),
  invoiceUrl: z.string().optional(),
});

const fleetDatabaseSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  vehicleType: z.string().min(1, "Vehicle Type is required"),
  makeModel: z.string().min(1, "Make & Model is required"),
  yearOfManufacture: z
    .number()
    .int()
    .positive("Year of manufacture must be positive"),
  chassisNumber: z.string().min(1, "Chassis Number is required"),
  engineNumber: z.string().min(1, "Engine Number is required"),
  assignedDriver: z.string().min(1, "Assigned Driver is required"),
  currentLocation: z.string().optional(),
  dateOfPurchase: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  insuranceStatus: z.enum(["Active", "Expired", "Renewed"]),
  nextServiceDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

const smoothTrackerSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  vehicleType: z.string().min(1, "Vehicle Type is required"),
  trackingDeviceId: z.string().min(1, "Tracking Device ID is required"),
  distanceCovered: z.number().positive("Distance covered must be positive"),
  fuelConsumption: z.number().positive("Fuel consumption must be positive"),
  alerts: z.array(z.string()),
});

const ImpressAnalysisSchema = z.object({
  regionName: z.string().min(1, "Region name is required"),
  officeName: z.string().min(1, "Office name is required"),
  reportDate: z.coerce.date(), // Automatically coerces valid date strings to Date objects
  budgetAllocated: z
    .number()
    .min(0, "Budget allocated must be a positive number"),
  amountSpent: z.number().min(0, "Amount spent must be a positive number"),
  expenseCategories: z.array(
    z.object({
      category: z.string().min(1, "Category name is required"),
      amount: z.number().min(0, "Amount must be a positive number"),
    })
  ),
  approvalStatus: z.enum(["Pending", "Approved", "Rejected"]),
  documentUrl: z.string().url("Invalid URL format").optional(),
});

const ICUCostReductionSchema = z.object({
  businessUnit: z.string().optional(),
  reportDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(), // Parse string to Date
  costSavingAreas: z
    .string()
    .transform((val) => JSON.parse(val))
    .optional(), // Parse string to array
  reductionStrategies: z
    .string()
    .transform((val) => JSON.parse(val))
    .optional(), // Parse string to array
  projectedSavings: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(), // Parse string to number
  actualSavings: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(), // Parse string to number
  implementationStatus: z.string().optional(),
  challenges: z
    .string()
    .transform((val) => JSON.parse(val))
    .optional(), // Parse string to array
  documentUrl: z.string().optional(),
});

// ICU Cost Reduction Schema
// const ICUCostReductionSchema = z.object({
//   businessUnit: z.string(),
//   reportDate: z.string().transform((val) => new Date(val)), // Parse string to Date
//   costSavingAreas: z.string().transform((val) => JSON.parse(val)), // Parse string to array
//   reductionStrategies: z.string().transform((val) => JSON.parse(val)), // Parse string to array
//   projectedSavings: z.string().transform((val) => parseFloat(val)), // Parse string to number
//   actualSavings: z.string().transform((val) => parseFloat(val)), // Parse string to number
//   implementationStatus: z.string(),
//   challenges: z.string().transform((val) => JSON.parse(val)), // Parse string to array
//   documentUrl: z.string().optional(),
// });
// Pre-Employment Medical Schema
const PreEmploymentMedicalSchema = z.object({
  candidateName: z.string(),
  jobPosition: z.string(),
  department: z.string(),
  examDate: z.date(),
  medicalFacility: z.string(),
  testsConducted: z.array(z.string()),
  medicalStatus: z.enum(["Fit", "Unfit", "Requires Further Review"]),
  reportUrl: z.string().optional(),
});

// Verification Report Schema
const VerificationReportSchema = z.object({
  candidateName: z.string(),
  jobPosition: z.string(),
  verificationType: z.enum([
    "Employment History",
    "Academic Records",
    "Criminal Record",
    "Reference Check",
  ]),
  verificationStatus: z.enum(["Completed", "Pending", "Issues Found"]),
  verificationDate: z.date(),
  verifiedBy: z.string(),
  reportSummary: z.string(),
  documentUrl: z.string().optional(),
});

const sanitizeFilename = (filename) => {
  return filename
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_.-]/g, ""); // Keep only safe characters
};

// Create a new fleet fueling record
FleetRouter.post("/fleet-fueling", authenticateToken, async (req, res) => {
  try {
    const validatedData = fleetFuelingSchema.parse(req.body);
    const newFueling = await prisma.fleetFueling.create({
      data: {
        ...validatedData,
        fuelingDate: new Date(validatedData.fuelingDate),
        userId: req.user.userId,
      },
    });
    res.status(201).json(newFueling);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get all fleet fueling records
FleetRouter.get("/fleet-fueling", authenticateToken, async (req, res) => {
  try {
    const fuelings = await prisma.fleetFueling.findMany({
      // where: { userId: req.user.userId },
    });
    res.status(200).json(fuelings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single fleet fueling record by ID
FleetRouter.get("/fleet-fueling/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const fueling = await prisma.fleetFueling.findUnique({ where: { id } });
    if (!fueling) {
      return res.status(404).json({ error: "Fueling record not found" });
    }
    res.status(200).json(fueling);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a fleet fueling record
FleetRouter.put("/fleet-fueling/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = fleetFuelingSchema.parse(req.body);
    const updatedFueling = await prisma.fleetFueling.update({
      where: { id },
      data: {
        ...validatedData,
        fuelingDate: new Date(validatedData.fuelingDate),
      },
    });
    res.status(200).json(updatedFueling);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete a fleet fueling record
FleetRouter.delete(
  "/fleet-fueling/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.fleetFueling.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.post("/fleet-repairs", authenticateToken, async (req, res) => {
  try {
    const validatedData = fleetRepairsSchema.parse(req.body);
    const newRepair = await prisma.fleetRepairs.create({
      data: {
        ...validatedData,
        repairDate: new Date(validatedData.repairDate),
        userId: req.user.userId,
      },
    });
    res.status(201).json(newRepair);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get all fleet repair records
FleetRouter.get("/fleet-repairs", authenticateToken, async (req, res) => {
  try {
    const repairs = await prisma.fleetRepairs.findMany({
      // where: { userId: req.user.userId },
    });
    res.status(200).json(repairs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single fleet repair record by ID
FleetRouter.get("/fleet-repairs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const repair = await prisma.fleetRepairs.findUnique({ where: { id } });
    if (!repair) {
      return res.status(404).json({ error: "Repair record not found" });
    }
    res.status(200).json(repair);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a fleet repair record
FleetRouter.put("/fleet-repairs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = fleetRepairsSchema.parse(req.body);
    const updatedRepair = await prisma.fleetRepairs.update({
      where: { id },
      data: {
        ...validatedData,
        repairDate: new Date(validatedData.repairDate),
      },
    });
    res.status(200).json(updatedRepair);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete a fleet repair record
FleetRouter.delete(
  "/fleet-repairs/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.fleetRepairs.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.post("/fleet-database", authenticateToken, async (req, res) => {
  try {
    const validatedData = fleetDatabaseSchema.parse(req.body);
    const newVehicle = await prisma.fleetDatabase.create({
      data: {
        ...validatedData,
        dateOfPurchase: new Date(validatedData.dateOfPurchase),
        nextServiceDate: new Date(validatedData.nextServiceDate),
        userId: req.user.userId,
      },
    });
    res.status(201).json(newVehicle);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get all fleet database records
FleetRouter.get("/fleet-database", authenticateToken, async (req, res) => {
  try {
    const vehicles = await prisma.fleetDatabase.findMany({
      where: { userId: req.user.userId },
    });
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single fleet database record by ID
FleetRouter.get("/fleet-database/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.fleetDatabase.findUnique({ where: { id } });
    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a fleet database record
FleetRouter.put("/fleet-database/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = fleetDatabaseSchema.parse(req.body);
    const updatedVehicle = await prisma.fleetDatabase.update({
      where: { id },
      data: {
        ...validatedData,
        dateOfPurchase: new Date(validatedData.dateOfPurchase),
        nextServiceDate: new Date(validatedData.nextServiceDate),
      },
    });
    res.status(200).json(updatedVehicle);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete a fleet database record
FleetRouter.delete("/fleet-database/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fleetDatabase.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

FleetRouter.post("/smooth-tracker", authenticateToken, async (req, res) => {
  try {
    const validatedData = smoothTrackerSchema.parse(req.body);
    const newTracker = await prisma.smoothTracker.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });
    res.status(201).json(newTracker);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get all smooth tracker records
FleetRouter.get("/smooth-tracker", authenticateToken, async (req, res) => {
  try {
    const trackers = await prisma.smoothTracker.findMany({
      where: { userId: req.user.userId },
    });
    res.status(200).json(trackers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single smooth tracker record by ID
FleetRouter.get("/smooth-tracker/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tracker = await prisma.smoothTracker.findUnique({ where: { id } });
    if (!tracker) {
      return res.status(404).json({ error: "Tracker record not found" });
    }
    res.status(200).json(tracker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a smooth tracker record
FleetRouter.put("/smooth-tracker/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = smoothTrackerSchema.parse(req.body);
    const updatedTracker = await prisma.smoothTracker.update({
      where: { id },
      data: validatedData,
    });
    res.status(200).json(updatedTracker);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete a smooth tracker record
FleetRouter.delete(
  "/smooth-tracker/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.smoothTracker.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// // / ICU Cost Reduction Routes
// FleetRouter.post("/icu-cost-reduction", authenticateToken, async (req, res) => {
//   try {
//     const validatedData = ICUCostReductionSchema.parse(req.body);

//     const report = await prisma.iCUCostReduction.create({
//       data: {
//         ...validatedData,
//         userId: req.user.userId,
//       },
//     });

//     res.status(201).json(report);
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res
//         .status(400)
//         .json({ error: "Validation failed", details: error.errors });
//     }
//     res.status(500).json({ error: error.message });
//   }
// });

// FleetRouter.post("/impress-analysis", authenticateToken, async (req, res) => {
//   try {
//     // Validate request body
//     const validatedData = ImpressAnalysisSchema.parse(req.body);

//     // Calculate variance
//     const variance = validatedData.budgetAllocated - validatedData.amountSpent;

//     // Create report in the database
//     const report = await prisma.impressAnalysis.create({
//       data: {
//         ...validatedData,
//         variance, // Add calculated variance
//         userId: req.user.userId, // Attach userId from authentication
//       },
//     });

//     // Return success response
//     res.status(201).json(report);
//   } catch (error) {
//     // Handle Zod validation errors
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({
//         error: "Validation failed",
//         details: error.errors,
//       });
//     }

//     // Handle Prisma errors
//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       return res.status(400).json({
//         error: "Database error",
//         details: error.message,
//       });
//     }

//     // Handle other errors
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

FleetRouter.post(
  "/verification-report",
  authenticateToken,
  async (req, res) => {
    try {
      let documentUrl = null;

      // Check if a file was uploaded
      if (req.files && req.files.document) {
        const document = req.files.document;

        // Validate file type (only PDFs allowed)
        if (document.mimetype !== "application/pdf") {
          return res.status(400).json({ error: "Only PDF files are allowed" });
        }

        // Generate a sanitized filename
        const originalName = path.basename(
          document.name,
          path.extname(document.name)
        );
        const safeFilename = sanitizeFilename(originalName);
        const finalFilename = `${Date.now()}-${safeFilename}.pdf`;

        const filePath = path.join(UPLOADS_DIR, finalFilename);

        // Move the file to the uploads directory
        await document.mv(filePath);

        // Store the URL path that will be used to access the file
        documentUrl = `/uploads/${finalFilename}`;
      }

      // Validate and parse request body
      const validatedData = VerificationReportSchema.parse({
        ...req.body,
        verificationDate: new Date(req.body.verificationDate),
        documentUrl,
      });

      // Store the report in the database
      const report = await prisma.verificationReport.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json({
        message: "Verification report created successfully",
        report,
        fileUrl: documentUrl
          ? `${req.protocol}://${req.get("host")}${documentUrl}`
          : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating verification report:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.get("/verification-report", authenticateToken, async (req, res) => {
  try {
    const reports = await prisma.verificationReport.findMany({
      // where: { userId: req.user.userId },
    });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

FleetRouter.get(
  "/verification-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const report = await prisma.verificationReport.findUnique({
        where: { id },
      });
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.patch(
  "/verification-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      let documentUrl = null;
      let updateData = {};

      // Check if a new file was uploaded
      if (req.files && req.files.document) {
        const document = req.files.document;

        // Validate file type (only PDFs allowed)
        if (document.mimetype !== "application/pdf") {
          return res.status(400).json({ error: "Only PDF files are allowed" });
        }

        // Generate a sanitized filename
        const originalName = path.basename(
          document.name,
          path.extname(document.name)
        );
        const safeFilename = sanitizeFilename(originalName);
        const finalFilename = `${Date.now()}-${safeFilename}.pdf`;

        const filePath = path.join(UPLOADS_DIR, finalFilename);

        // Move the file to the uploads directory
        await document.mv(filePath);

        // Store the URL path that will be used to access the file
        documentUrl = `/uploads/${finalFilename}`;
        updateData.documentUrl = documentUrl;
      }

      // Dynamically update only the provided fields
      const allowedFields = [
        "candidateName",
        "jobPosition",
        "verificationType",
        "verificationStatus",
        "verificationDate",
        "verifiedBy",
        "reportSummary",
      ];

      allowedFields.forEach((field) => {
        if (req.body[field]) {
          updateData[field] = req.body[field];
        }
      });

      // Convert verificationDate if provided
      if (updateData.verificationDate) {
        updateData.verificationDate = new Date(updateData.verificationDate);
      }

      // Check if there is something to update
      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update" });
      }

      // Update the verification report in the database
      const updatedReport = await prisma.verificationReport.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        message: "Verification report updated successfully",
        report: updatedReport,
        fileUrl: documentUrl
          ? `${req.protocol}://${req.get("host")}${documentUrl}`
          : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating verification report:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.delete(
  "/verification-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.verificationReport.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// FleetRouter.post(
//   "/pre-employment-medical",
//   authenticateToken,
//   async (req, res) => {
//     try {
//       let reportUrl = null;

//       // Check if a PDF file was uploaded
//       if (req.files && req.files.document) {
//         const document = req.files.document;

//         // Validate file type (only PDFs allowed)
//         if (document.mimetype !== "application/pdf") {
//           return res.status(400).json({ error: "Only PDF files are allowed" });
//         }

//         // Generate a sanitized filename
//         const originalName = path.basename(
//           document.name,
//           path.extname(document.name)
//         );
//         const safeFilename = sanitizeFilename(originalName);
//         const finalFilename = `${Date.now()}-${safeFilename}.pdf`;

//         const filePath = path.join(UPLOADS_DIR, finalFilename);

//         // Move the file to the uploads directory
//         await document.mv(filePath);

//         // Store the URL path to access the file
//         reportUrl = `/uploads/${finalFilename}`;
//       }

//       // Validate and parse request body
//       const validatedData = PreEmploymentMedicalSchema.parse({
//         ...req.body,
//         examDate: new Date(req.body.examDate),
//         reportUrl, // Include uploaded file URL if available
//       });

//       // Save the medical record in the database
//       const medicalRecord = await prisma.preEmploymentMedical.create({
//         data: {
//           ...validatedData,
//           userId: req.user.userId,
//         },
//       });

//       res.status(201).json({
//         message: "Medical record created successfully",
//         medicalRecord,
//         fileUrl: reportUrl
//           ? `${req.protocol}://${req.get("host")}${reportUrl}`
//           : null,
//       });
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         return res
//           .status(400)
//           .json({ error: "Validation failed", details: error.errors });
//       }
//       console.error("Error creating medical record:", error);
//       res.status(500).json({ error: error.message });
//     }
//   }
// );

FleetRouter.post(
  "/pre-employment-medical",
  authenticateToken,
  async (req, res) => {
    try {
      let documentUrl = null;

      // Handle PDF file upload
      if (req.files && req.files.document) {
        const document = req.files.document;

        // Validate file type (only PDFs allowed)
        if (document.mimetype !== "application/pdf") {
          return res.status(400).json({ error: "Only PDF files are allowed" });
        }

        // Generate a unique filename
        const finalFilename = `${Date.now()}-${document.name}`;
        const filePath = path.join(UPLOADS_DIR, finalFilename);
        await document.mv(filePath);

        // Store file URL
        documentUrl = `/uploads/${finalFilename}`;
      }

      // Convert testsConducted to an array if received as a string
      const testsConducted = req.body.testsConducted
        ? JSON.parse(req.body.testsConducted)
        : [];

      // Convert examDate to a Date object
      const examDate = req.body.examDate ? new Date(req.body.examDate) : null;

      // Validate request data
      const validatedData = PreEmploymentMedicalSchema.parse({
        ...req.body,
        testsConducted,
        examDate, // Use converted date
        documentUrl,
      });

      // Save to database
      const medicalRecord = await prisma.preEmploymentMedical.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json({
        message: "Pre-employment medical record created successfully",
        medicalRecord,
        fileUrl: documentUrl
          ? `${req.protocol}://${req.get("host")}${documentUrl}`
          : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error processing request:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.patch(
  "/pre-employment-medical/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      let documentUrl = null;

      // Check if the record exists
      const existingRecord = await prisma.preEmploymentMedical.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }

      // Handle PDF file upload (if provided)
      if (req.files && req.files.document) {
        const document = req.files.document;

        // Validate file type (only PDFs allowed)
        if (document.mimetype !== "application/pdf") {
          return res.status(400).json({ error: "Only PDF files are allowed" });
        }

        // Generate a unique filename
        const finalFilename = `${Date.now()}-${document.name}`;
        const filePath = path.join(UPLOADS_DIR, finalFilename);
        await document.mv(filePath);

        // Store file URL
        documentUrl = `/uploads/${finalFilename}`;
      }

      // Convert testsConducted to an array if provided
      const testsConducted = req.body.testsConducted
        ? JSON.parse(req.body.testsConducted)
        : existingRecord.testsConducted;

      // Convert examDate to a Date object if provided
      const examDate = req.body.examDate
        ? new Date(req.body.examDate)
        : existingRecord.examDate;

      // Construct update data
      const updateData = {
        candidateName: req.body.candidateName || existingRecord.candidateName,
        jobPosition: req.body.jobPosition || existingRecord.jobPosition,
        department: req.body.department || existingRecord.department,
        examDate,
        medicalFacility:
          req.body.medicalFacility || existingRecord.medicalFacility,
        testsConducted,
        medicalStatus: req.body.medicalStatus || existingRecord.medicalStatus,
        documentUrl: documentUrl || existingRecord.documentUrl, // Update if new file uploaded
      };

      // Validate the updated data
      const validatedData =
        PreEmploymentMedicalSchema.partial().parse(updateData);

      // Update the database
      const updatedRecord = await prisma.preEmploymentMedical.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        message: "Pre-employment medical record updated successfully",
        updatedRecord,
        fileUrl: documentUrl
          ? `${req.protocol}://${req.get("host")}${documentUrl}`
          : existingRecord.documentUrl,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating record:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.get(
  "/pre-employment-medical",
  authenticateToken,
  async (req, res) => {
    try {
      const medicalRecords = await prisma.preEmploymentMedical.findMany({
        // where: { userId: req.user.userId },
      });
      res.status(200).json(medicalRecords);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.get(
  "/pre-employment-medical/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const medicalRecord = await prisma.preEmploymentMedical.findUnique({
        where: { id },
      });
      if (!medicalRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }
      res.status(200).json(medicalRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.delete(
  "/pre-employment-medical/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.preEmploymentMedical.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// icu-cost-reduction

FleetRouter.post("/icu-cost-reduction", authenticateToken, async (req, res) => {
  try {
    let documentUrl = null;

    // Check if a file was uploaded
    if (req.files && req.files.document) {
      const document = req.files.document;

      // Validate file type (only PDFs allowed)
      if (document.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      // Generate a sanitized filename
      const originalName = path.basename(
        document.name,
        path.extname(document.name)
      );
      const safeFilename = sanitizeFilename(originalName);
      const finalFilename = `${Date.now()}-${safeFilename}.pdf`;

      const filePath = path.join(UPLOADS_DIR, finalFilename);

      // Move the file to the uploads directory
      await document.mv(filePath);
      documentUrl = `/uploads/${finalFilename}`; // Store the sanitized file URL
    }

    // Validate and parse request body
    const validatedData = ICUCostReductionSchema.parse({
      ...req.body,
      documentUrl, // Include the file URL in the validated data
    });

    // Store the report in the database
    const report = await prisma.iCUCostReduction.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "ICU cost reduction report created successfully",
      report,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

FleetRouter.patch(
  "/icu-cost-reduction/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params; // Get the report ID from the URL
      let documentUrl = null;

      // Check if a file was uploaded
      if (req.files && req.files.document) {
        const document = req.files.document;

        // Validate file type (only PDFs allowed)
        if (document.mimetype !== "application/pdf") {
          return res.status(400).json({ error: "Only PDF files are allowed" });
        }

        // Generate a sanitized filename
        const originalName = path.basename(
          document.name,
          path.extname(document.name)
        );
        const safeFilename = sanitizeFilename(originalName);
        const finalFilename = `${Date.now()}-${safeFilename}.pdf`;

        const filePath = path.join(UPLOADS_DIR, finalFilename);

        // Move the file to the uploads directory
        await document.mv(filePath);
        documentUrl = `/uploads/${finalFilename}`; // Store the sanitized file URL
      }

      // Validate and parse request body
      const validatedData = ICUCostReductionSchema.parse({
        ...req.body,
        documentUrl: documentUrl || req.body.documentUrl, // Use new file URL or keep existing one
      });

      // Update the report in the database
      const updatedReport = await prisma.iCUCostReduction.update({
        where: { id: id }, // Ensure ID is a number
        data: validatedData,
      });

      res.status(200).json({
        message: "ICU cost reduction report updated successfully",
        report: updatedReport,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      if (error.code === "P2025") {
        // Prisma error for record not found
        return res.status(404).json({ error: "Report not found" });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.get("/icu-cost-reduction", authenticateToken, async (req, res) => {
  try {
    const reports = await prisma.iCUCostReduction.findMany({
      // where: { userId: req.user.userId },
    });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

FleetRouter.get(
  "/icu-cost-reduction/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const report = await prisma.iCUCostReduction.findUnique({
        where: { id },
      });
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.post("/impress-analysis", authenticateToken, async (req, res) => {
  try {
    let documentUrl = null;

    // Check if a file was uploaded
    if (req.files && req.files.document) {
      const document = req.files.document;

      // Validate file type (only PDFs allowed)
      if (document.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      // Generate a sanitized filename
      const originalName = path.basename(
        document.name,
        path.extname(document.name)
      );
      const safeFilename = sanitizeFilename(originalName);
      const finalFilename = `${Date.now()}-${safeFilename}.pdf`;

      const filePath = path.join(UPLOADS_DIR, finalFilename);

      // Move the file to the uploads directory
      await document.mv(filePath);
      documentUrl = `/uploads/${finalFilename}`; // Store the sanitized file URL
    }

    // Validate and parse request body
    const validatedData = ImpressAnalysisSchema.parse({
      ...req.body,
      documentUrl, // Include the file URL in the validated data
    });

    // Calculate variance
    const variance = validatedData.budgetAllocated - validatedData.amountSpent;

    // Store the report in the database
    const report = await prisma.impressAnalysis.create({
      data: {
        ...validatedData,
        variance,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "Impress analysis report created successfully",
      report,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res
        .status(400)
        .json({ error: "Database error", details: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// import express from "express";
// import { z } from "zod";
// import { Prisma, PrismaClient } from "@prisma/client";
// import { authenticateToken, authorizeRole } from "../middlewares/userauth.js";

// const prisma = new PrismaClient();
// const FleetRouter = express.Router();

// ... (existing code for fleet-related routes)

// Impress Analysis Routes
FleetRouter.post("/impress-analysis", authenticateToken, async (req, res) => {
  try {
    const validatedData = ImpressAnalysisSchema.parse(req.body);
    const variance = validatedData.budgetAllocated - validatedData.amountSpent;

    const report = await prisma.impressAnalysis.create({
      data: {
        ...validatedData,
        variance,
        userId: req.user.userId,
      },
    });

    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res
        .status(400)
        .json({ error: "Database error", details: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

FleetRouter.get("/impress-analysis", authenticateToken, async (req, res) => {
  try {
    const reports = await prisma.impressAnalysis.findMany({
      where: { userId: req.user.userId },
    });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

FleetRouter.get(
  "/impress-analysis/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const report = await prisma.impressAnalysis.findUnique({ where: { id } });
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.put(
  "/impress-analysis/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = ImpressAnalysisSchema.parse(req.body);
      const variance =
        validatedData.budgetAllocated - validatedData.amountSpent;

      const updatedReport = await prisma.impressAnalysis.update({
        where: { id },
        data: {
          ...validatedData,
          variance,
        },
      });

      res.status(200).json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.delete(
  "/impress-analysis/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.impressAnalysis.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ICU Cost Reduction Routes
FleetRouter.post("/icu-cost-reduction", authenticateToken, async (req, res) => {
  try {
    const validatedData = ICUCostReductionSchema.parse(req.body);

    const report = await prisma.iCUCostReduction.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });

    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

FleetRouter.get("/icu-cost-reduction", authenticateToken, async (req, res) => {
  try {
    const reports = await prisma.iCUCostReduction.findMany({
      where: { userId: req.user.userId },
    });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

FleetRouter.get(
  "/icu-cost-reduction/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const report = await prisma.iCUCostReduction.findUnique({
        where: { id },
      });
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.put(
  "/icu-cost-reduction/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = ICUCostReductionSchema.parse(req.body);

      const updatedReport = await prisma.iCUCostReduction.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.delete(
  "/icu-cost-reduction/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.iCUCostReduction.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Pre-Employment Medical Routes
FleetRouter.post(
  "/pre-employment-medical",
  authenticateToken,
  async (req, res) => {
    try {
      const validatedData = PreEmploymentMedicalSchema.parse(req.body);

      const medicalRecord = await prisma.preEmploymentMedical.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json(medicalRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.get(
  "/pre-employment-medical",
  authenticateToken,
  async (req, res) => {
    try {
      const medicalRecords = await prisma.preEmploymentMedical.findMany({
        where: { userId: req.user.userId },
      });
      res.status(200).json(medicalRecords);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.get(
  "/pre-employment-medical/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const medicalRecord = await prisma.preEmploymentMedical.findUnique({
        where: { id },
      });
      if (!medicalRecord) {
        return res.status(404).json({ error: "Medical record not found" });
      }
      res.status(200).json(medicalRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.put(
  "/pre-employment-medical/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = PreEmploymentMedicalSchema.parse(req.body);

      const updatedMedicalRecord = await prisma.preEmploymentMedical.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json(updatedMedicalRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.delete(
  "/pre-employment-medical/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.preEmploymentMedical.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Verification Report Routes
FleetRouter.post(
  "/verification-report",
  authenticateToken,
  async (req, res) => {
    try {
      const validatedData = VerificationReportSchema.parse(req.body);

      const report = await prisma.verificationReport.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.get("/verification-report", authenticateToken, async (req, res) => {
  try {
    const reports = await prisma.verificationReport.findMany({
      where: { userId: req.user.userId },
    });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

FleetRouter.get(
  "/verification-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const report = await prisma.verificationReport.findUnique({
        where: { id },
      });
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.put(
  "/verification-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = VerificationReportSchema.parse(req.body);

      const updatedReport = await prisma.verificationReport.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

FleetRouter.delete(
  "/verification-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.verificationReport.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export { FleetRouter };
