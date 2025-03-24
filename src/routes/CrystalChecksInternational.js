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
const CCIRouter = express.Router();

const ClientInfoSchema = z.object({
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  companyName: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  businessAddress: z.string().min(1),
  contractType: z.string().optional(),
});

const SLASchema = z.object({
  slaId: z.string().min(1, "SLA ID is required"),
  clientName: z.string().min(1, "Client name is required"),
  agreementType: z.string().min(1, "Agreement type is required"),
  startDate: z.coerce.date({ message: "Invalid start date" }),
  endDate: z.coerce.date({ message: "Invalid end date" }),
  keyTerms: z.string().min(1, "Key terms are required"),
  approvalStatus: z.enum(["Draft", "Approved", "Signed"], {
    message: "Invalid approval status",
  }),
});

const ATSSchema = z.object({
  candidateId: z.string().min(1, "Candidate ID is required"),
  fullName: z.string().min(1, "Full name is required"),
  positionApplied: z.string().min(1, "Position applied is required"),
  applicationDate: z.coerce.date({ message: "Invalid application date" }),
  recruitmentStatus: z.enum(["Screened", "Interviewed", "Hired", "Rejected"], {
    message: "Invalid recruitment status",
  }),
  guarantors: z
    .array(
      z.object({
        name: z.string().min(1, "Guarantor name is required"),
        relationship: z.string().min(1, "Relationship is required"),
        contact: z.string().min(1, "Contact is required"),
      })
    )
    .optional(),
});
const sanitizeFilename = (filename) => {
  return filename
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_.-]/g, ""); // Keep only safe characters
};

// Client Information Zod Schema

// Helper function for document upload
const handleClientDocuments = async (files) => {
  if (!files) return [];

  const allowedTypes = [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const documents = Array.isArray(files) ? files : [files];
  const uploadedDocs = [];

  for (const doc of documents) {
    if (!allowedTypes.includes(doc.mimetype)) {
      throw new Error(`Invalid file type for document: ${doc.name}`);
    }

    const originalName = path.basename(doc.name, path.extname(doc.name));
    const safeFilename = sanitizeFilename(originalName);
    const finalFilename = `${Date.now()}-${safeFilename}${path.extname(
      doc.name
    )}`;
    const filePath = path.join(UPLOADS_DIR, finalFilename);

    await doc.mv(filePath);
    uploadedDocs.push(`/uploads/${finalFilename}`);
  }

  return uploadedDocs;
};

CCIRouter.get("/client-info", authenticateToken, async (req, res) => {
  try {
    const clients = await prisma.clientInformation.findMany({
      // where: { userId: req.user.userId },
    });
    res.status(200).json(clients);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Create Client
CCIRouter.post("/client-info", authenticateToken, async (req, res) => {
  try {
    let documents = [];

    // Handle document uploads
    if (req.files?.documents) {
      documents = await handleClientDocuments(req.files.documents);
    }

    console.log({
      jfjf: documents,
      kaka: req.files.documents,
    });

    // // Validate request body
    const validatedData = ClientInfoSchema.parse(req.body);

    // Create client record
    const client = await prisma.clientInformation.create({
      data: {
        ...validatedData,
        documents,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "Client created successfully",
      client,
      documents: documents.map(
        (doc) => `${req.protocol}://${req.get("host")}${doc}`
      ),
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get All Clients

// Get Single Client
CCIRouter.get("/client-info/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.clientInformation.findUnique({
      where: { id },
    });

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.status(200).json(client);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Update Client
CCIRouter.patch("/client-info/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = {};
    let newDocuments = [];

    // Handle document updates
    if (req.files?.documents) {
      newDocuments = await handleClientDocuments(req.files.documents);

      // Get existing documents if needed
      const existingClient = await prisma.clientInformation.findUnique({
        where: { id },
      });
      const existingDocs = existingClient?.documents || [];

      updateData.documents = [...existingDocs, ...newDocuments];

      // Use this instead if you want to replace documents:
      // updateData.documents = newDocuments;
    }

    // Validate and prepare update data
    const allowedFields = [
      "clientId",
      "clientName",
      "companyName",
      "contactPerson",
      "phone",
      "email",
      "businessAddress",
      "contractType",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        updateData[field] = req.body[field];
      }
    });

    // Check if there's data to update
    if (Object.keys(updateData).length === 0 && newDocuments.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    // Update client record
    const updatedClient = await prisma.clientInformation.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      message: "Client updated successfully",
      client: updatedClient,
      newDocuments: newDocuments.map(
        (doc) => `${req.protocol}://${req.get("host")}${doc}`
      ),
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Delete Client
CCIRouter.delete("/client-info/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Add logic to delete associated files
    const client = await prisma.clientInformation.findUnique({ where: { id } });

    // If you want to delete physical files:
    // if (client.documents) {
    //   client.documents.forEach(doc => {
    //     const filePath = path.join(UPLOADS_DIR, path.basename(doc));
    //     fs.unlinkSync(filePath);
    //   });
    // }

    await prisma.clientInformation.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

const handleErrorResponse = (error, res) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.errors,
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      error: "Database error",
      details: error.message,
    });
  }
  res.status(500).json({ error: error.message });
};

// Helper function for document upload
const handleSLADocuments = async (files) => {
  if (!files) return [];

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const documents = Array.isArray(files) ? files : [files];
  const uploadedDocs = [];

  for (const doc of documents) {
    if (!allowedTypes.includes(doc.mimetype)) {
      throw new Error(`Invalid file type for document: ${doc.name}`);
    }

    const originalName = path.basename(doc.name, path.extname(doc.name));
    const safeFilename = sanitizeFilename(originalName);
    const finalFilename = `${Date.now()}-${safeFilename}${path.extname(
      doc.name
    )}`;
    const filePath = path.join(UPLOADS_DIR, finalFilename);

    await doc.mv(filePath);
    uploadedDocs.push(`/uploads/${finalFilename}`);
  }

  return uploadedDocs;
};

// Create SLA
CCIRouter.post("/sla", authenticateToken, async (req, res) => {
  try {
    let supportingDocs = [];

    // Handle document uploads
    if (req.files?.documents) {
      supportingDocs = await handleSLADocuments(req.files.documents);
    }

    // Validate request body
    const validatedData = SLASchema.parse({
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
    });

    // Create SLA record
    const sla = await prisma.sLA.create({
      data: {
        ...validatedData,
        supportingDocs,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "SLA created successfully",

      sla,
      documents: supportingDocs.map(
        (doc) => `${req.protocol}://${req.get("host")}${doc}`
      ),
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get All SLAs
CCIRouter.get("/sla", authenticateToken, async (req, res) => {
  try {
    const slas = await prisma.sLA.findMany({
      // where: { userId: req.user.userId }, // Uncomment to filter by user
    });
    res.status(200).json(slas);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get Single SLA
CCIRouter.get("/sla/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sla = await prisma.sLA.findUnique({
      where: { id },
    });

    if (!sla) {
      return res.status(404).json({ error: "SLA not found" });
    }

    res.status(200).json(sla);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Update SLA
CCIRouter.patch("/sla/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = {};
    let newDocuments = [];

    // Handle document updates
    if (req.files?.documents) {
      newDocuments = await handleSLADocuments(req.files.documents);

      // Get existing documents if needed
      const existingSLA = await prisma.sLA.findUnique({ where: { id } });
      const existingDocs = existingSLA?.supportingDocs || [];

      updateData.supportingDocs = [...existingDocs, ...newDocuments];
    }

    // Validate and prepare update data
    const allowedFields = [
      "slaId",
      "clientName",
      "agreementType",
      "startDate",
      "endDate",
      "keyTerms",
      "approvalStatus",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        updateData[field] = req.body[field];
      }
    });

    // Convert dates if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    // Check if there's data to update
    if (Object.keys(updateData).length === 0 && newDocuments.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    // Update SLA record
    const updatedSLA = await prisma.sLA.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      message: "SLA updated successfully",
      sla: updatedSLA,
      newDocuments: newDocuments.map(
        (doc) => `${req.protocol}://${req.get("host")}${doc}`
      ),
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Delete SLA
CCIRouter.delete("/sla/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Add logic to delete associated files
    const sla = await prisma.sLA.findUnique({ where: { id } });

    // If you want to delete physical files:
    // if (sla.supportingDocs) {
    //   sla.supportingDocs.forEach((doc) => {
    //     const filePath = path.join(UPLOADS_DIR, path.basename(doc));
    //     fs.unlinkSync(filePath);
    //   });
    // }

    await prisma.sLA.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Helper function for resume upload
const handleResumeUpload = async (file) => {
  if (!file) return null;

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type for resume: ${file.name}`);
  }

  const originalName = path.basename(file.name, path.extname(file.name));
  const safeFilename = sanitizeFilename(originalName);
  const finalFilename = `${Date.now()}-${safeFilename}${path.extname(
    file.name
  )}`;
  const filePath = path.join(UPLOADS_DIR, finalFilename);

  await file.mv(filePath);
  return `/uploads/${finalFilename}`;
};

// Create ATS Record
CCIRouter.post("/ats", authenticateToken, async (req, res) => {
  try {
    let resumeUrl = null;

    // // Handle resume upload
    if (req.files?.resume) {
      resumeUrl = await handleResumeUpload(req.files.resume);
    }

    // Validate request body
    const validatedData = ATSSchema.parse({
      ...req.body,
      applicationDate: new Date(req.body.applicationDate),
      guarantors: req.body.guarantors
        ? JSON.parse(req.body.guarantors)
        : undefined,
    });

    // Create ATS record
    const ats = await prisma.aTS.create({
      data: {
        ...validatedData,
        resumeUrl,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "ATS record created successfully",

      ats,
      resumeUrl: resumeUrl
        ? `${req.protocol}://${req.get("host")}${resumeUrl}`
        : null,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get All ATS Records
CCIRouter.get("/ats", authenticateToken, async (req, res) => {
  try {
    const atsRecords = await prisma.aTS.findMany({
      // where: { userId: req.user.userId }, // Uncomment to filter by user
    });
    res.status(200).json(atsRecords);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get Single ATS Record
CCIRouter.get("/ats/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const atsRecord = await prisma.aTS.findUnique({
      where: { id },
    });

    if (!atsRecord) {
      return res.status(404).json({ error: "ATS record not found" });
    }

    res.status(200).json(atsRecord);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Update ATS Record
CCIRouter.patch("/ats/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = {};
    let newResumeUrl = null;

    // Handle resume update
    if (req.files?.resume) {
      newResumeUrl = await handleResumeUpload(req.files.resume);
      updateData.resumeUrl = newResumeUrl;
    }

    // Validate and prepare update data
    const allowedFields = [
      "candidateId",
      "fullName",
      "positionApplied",
      "applicationDate",
      "recruitmentStatus",
      "guarantors",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        updateData[field] = req.body[field];
      }
    });

    // Convert dates if provided
    if (updateData.applicationDate) {
      updateData.applicationDate = new Date(updateData.applicationDate);
    }

    // Parse guarantors if provided
    if (updateData.guarantors) {
      updateData.guarantors = JSON.parse(updateData.guarantors);
    }

    // Check if there's data to update
    if (Object.keys(updateData).length === 0 && !newResumeUrl) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    // Update ATS record
    const updatedATS = await prisma.aTS.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      message: "ATS record updated successfully",
      ats: updatedATS,
      resumeUrl: newResumeUrl
        ? `${req.protocol}://${req.get("host")}${newResumeUrl}`
        : null,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Delete ATS Record
CCIRouter.delete("/ats/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Add logic to delete associated resume file
    const atsRecord = await prisma.aTS.findUnique({ where: { id } });

    // If you want to delete the resume file:
    // if (atsRecord.resumeUrl) {
    //   const filePath = path.join(UPLOADS_DIR, path.basename(atsRecord.resumeUrl));
    //   fs.unlinkSync(filePath);
    // }

    await prisma.aTS.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    handleErrorResponse(error, res);
  }
});
export { CCIRouter };
