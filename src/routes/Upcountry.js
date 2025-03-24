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
const UpcountryRouter = express.Router();

// Job Portal Schema
const JobPortalSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  location: z.string().min(1, "Location is required"),
  applicationDeadline: z.coerce.date({
    message: "Invalid application deadline",
  }),
  numberOfApplicants: z
    .number()
    .int()
    .min(0, "Number of applicants must be a positive integer"),
  jobStatus: z.enum(["Open", "Closed", "Filled"], {
    message: "Invalid job status",
  }),
  postingPlatform: z.string().min(1, "Posting platform is required"),
});

// WhatsApp Status Schema
const WhatsAppStatusSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  datePosted: z.coerce.date({ message: "Invalid date posted" }),
  engagement: z.object({
    clicks: z.number().int().min(0, "Clicks must be a positive integer"),
    shares: z.number().int().min(0, "Shares must be a positive integer"),
    inquiries: z.number().int().min(0, "Inquiries must be a positive integer"),
  }),
  numberOfApplicants: z
    .number()
    .int()
    .min(0, "Number of applicants must be a positive integer"),
  recruiterContact: z.string().min(1, "Recruiter contact is required"),
  applicationLink: z.string().url("Invalid URL format").optional(),
});

// Referral Schema
const ReferralSchema = z.object({
  referredCandidate: z.string().min(1, "Referred candidate name is required"),
  referringPerson: z.string().min(1, "Referring person name is required"),
  jobTitleApplied: z.string().min(1, "Job title applied is required"),
  referringContact: z.string().min(1, "Referring person's contact is required"),
  candidateContact: z.string().min(1, "Candidate's contact is required"),
  applicationDate: z.coerce.date({ message: "Invalid application date" }),
  recruitmentStatus: z.enum(["Screened", "Interviewed", "Hired", "Rejected"], {
    message: "Invalid recruitment status",
  }),
});

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

// Create Job Portal Entry
UpcountryRouter.post("/job-portal", authenticateToken, async (req, res) => {
  try {
    const validatedData = JobPortalSchema.parse({
      ...req.body,
      applicationDeadline: new Date(req.body.applicationDeadline),
    });

    const job = await prisma.jobPortal.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "Job portal entry created successfully",
      job,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get All Job Portal Entries
UpcountryRouter.get("/job-portal", authenticateToken, async (req, res) => {
  try {
    const jobs = await prisma.jobPortal.findMany({
      // where: { userId: req.user.userId }, // Uncomment to filter by user
    });
    res.status(200).json(jobs);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get Single Job Portal Entry
UpcountryRouter.get("/job-portal/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const job = await prisma.jobPortal.findUnique({ where: { id } });

    if (!job) {
      return res.status(404).json({ error: "Job portal entry not found" });
    }

    res.status(200).json(job);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Update Job Portal Entry
UpcountryRouter.patch(
  "/job-portal/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = JobPortalSchema.partial().parse(req.body);

      const updatedJob = await prisma.jobPortal.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        message: "Job portal entry updated successfully",
        job: updatedJob,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Delete Job Portal Entry
UpcountryRouter.delete(
  "/job-portal/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.jobPortal.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Create WhatsApp Status Entry
UpcountryRouter.post(
  "/whatsapp-status",
  authenticateToken,
  async (req, res) => {
    try {
      const validatedData = WhatsAppStatusSchema.parse({
        ...req.body,
        datePosted: new Date(req.body.datePosted),
      });

      const status = await prisma.whatsAppStatus.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json({
        message: "WhatsApp status entry created successfully",
        status,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Get All WhatsApp Status Entries
UpcountryRouter.get("/whatsapp-status", authenticateToken, async (req, res) => {
  try {
    const statuses = await prisma.whatsAppStatus.findMany({
      // where: { userId: req.user.userId }, // Uncomment to filter by user
    });
    res.status(200).json(statuses);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get Single WhatsApp Status Entry
UpcountryRouter.get(
  "/whatsapp-status/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const status = await prisma.whatsAppStatus.findUnique({ where: { id } });

      if (!status) {
        return res
          .status(404)
          .json({ error: "WhatsApp status entry not found" });
      }

      res.status(200).json(status);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Update WhatsApp Status Entry
UpcountryRouter.patch(
  "/whatsapp-status/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = WhatsAppStatusSchema.partial().parse(req.body);

      const updatedStatus = await prisma.whatsAppStatus.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        message: "WhatsApp status entry updated successfully",
        status: updatedStatus,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Delete WhatsApp Status Entry
UpcountryRouter.delete(
  "/whatsapp-status/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.whatsAppStatus.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Create Referral Entry
UpcountryRouter.post("/referral", authenticateToken, async (req, res) => {
  try {
    const validatedData = ReferralSchema.parse({
      ...req.body,
      applicationDate: new Date(req.body.applicationDate),
    });

    const referral = await prisma.referral.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "Referral entry created successfully",
      referral,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get All Referral Entries
UpcountryRouter.get("/referral", authenticateToken, async (req, res) => {
  try {
    const referrals = await prisma.referral.findMany({
      // where: { userId: req.user.userId }, // Uncomment to filter by user
    });
    res.status(200).json(referrals);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get Single Referral Entry
UpcountryRouter.get("/referral/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const referral = await prisma.referral.findUnique({ where: { id } });

    if (!referral) {
      return res.status(404).json({ error: "Referral entry not found" });
    }

    res.status(200).json(referral);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Update Referral Entry
UpcountryRouter.patch("/referral/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = ReferralSchema.partial().parse(req.body);

    const updatedReferral = await prisma.referral.update({
      where: { id },
      data: validatedData,
    });

    res.status(200).json({
      message: "Referral entry updated successfully",
      referral: updatedReferral,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Delete Referral Entry
UpcountryRouter.delete("/referral/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.referral.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// lekki side

const DriverSchema = z.object({
  driverId: z.string().min(1, "Driver ID is required"),
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.coerce.date({ message: "Invalid date of birth" }),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiryDate: z.coerce.date({ message: "Invalid license expiry date" }),
  employmentStatus: z.enum(["Active", "Suspended", "Terminated"], {
    message: "Invalid employment status",
  }),
  dateOfEmployment: z.coerce.date({ message: "Invalid date of employment" }),
  assignedVehicle: z.string().optional(),
  vehicleLicensePlate: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  nextOfKinName: z.string().min(1, "Next of kin name is required"),
  nextOfKinContact: z.string().min(1, "Next of kin contact is required"),
  medicalFitnessStatus: z.enum(["Fit", "Unfit", "Pending"], {
    message: "Invalid medical fitness status",
  }),
  lastTrainingDate: z.coerce
    .date({ message: "Invalid last training date" })
    .optional(),
});

UpcountryRouter.post("/lekki/driver", authenticateToken, async (req, res) => {
  try {
    const validatedData = DriverSchema.parse({
      ...req.body,
      dateOfBirth: new Date(req.body.dateOfBirth),
      licenseExpiryDate: new Date(req.body.licenseExpiryDate),
      dateOfEmployment: new Date(req.body.dateOfEmployment),
      lastTrainingDate: req.body.lastTrainingDate
        ? new Date(req.body.lastTrainingDate)
        : undefined,
    });

    const driver = await prisma.driver.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "Driver created successfully",
      driver,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

UpcountryRouter.get("/lekki/driver", authenticateToken, async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      // where: { userId: req.user.userId }, // Uncomment to filter by user
    });
    res.status(200).json(drivers);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

UpcountryRouter.patch(
  "/lekki/driver/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = DriverSchema.partial().parse({
        ...req.body,
        dateOfBirth: req.body.dateOfBirth
          ? new Date(req.body.dateOfBirth)
          : undefined,
        licenseExpiryDate: req.body.licenseExpiryDate
          ? new Date(req.body.licenseExpiryDate)
          : undefined,
        dateOfEmployment: req.body.dateOfEmployment
          ? new Date(req.body.dateOfEmployment)
          : undefined,
        lastTrainingDate: req.body.lastTrainingDate
          ? new Date(req.body.lastTrainingDate)
          : undefined,
      });

      const updatedDriver = await prisma.driver.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        message: "Driver updated successfully",
        driver: updatedDriver,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

UpcountryRouter.get(
  "/lekki/driver/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const driver = await prisma.driver.findUnique({ where: { id } });

      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      res.status(200).json(driver);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

UpcountryRouter.delete(
  "/lekki/driver/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.driver.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Business Performance Report Schema
const BusinessPerformanceReportSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  reportingPeriod: z.string().min(1, "Reporting period is required"),
  totalRevenue: z.number().min(0, "Total revenue must be a positive number"),
  totalExpenses: z.number().min(0, "Total expenses must be a positive number"),
  netProfitLoss: z.number(),
  keyPerformanceIndicators: z.array(
    z.object({
      name: z.string().min(1, "KPI name is required"),
      value: z.number().min(0, "KPI value must be a positive number"),
    })
  ),
  topPerformingServices: z.array(
    z.object({
      name: z.string().min(1, "Service/product name is required"),
      revenue: z.number().min(0, "Revenue must be a positive number"),
    })
  ),
  clientAcquisitionCount: z
    .number()
    .int()
    .min(0, "Client acquisition count must be a positive integer"),
  operationalChallenges: z
    .string()
    .min(1, "Operational challenges are required"),
  generatedBy: z.string().min(1, "Generated by is required"),
  approvalStatus: z.enum(["Pending", "Approved", "Rejected"], {
    message: "Invalid approval status",
  }),
});

// Recruitment Report Schema
const RecruitmentReportSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  reportingPeriod: z.string().min(1, "Reporting period is required"),
  totalJobOpenings: z
    .number()
    .int()
    .min(0, "Total job openings must be a positive integer"),
  applicationsReceived: z
    .number()
    .int()
    .min(0, "Applications received must be a positive integer"),
  candidatesInterviewed: z
    .number()
    .int()
    .min(0, "Candidates interviewed must be a positive integer"),
  candidatesHired: z
    .number()
    .int()
    .min(0, "Candidates hired must be a positive integer"),
  timeToFill: z
    .number()
    .int()
    .min(0, "Time-to-fill must be a positive integer"),
  candidateSourceBreakdown: z.object({
    referrals: z.number().int().min(0, "Referrals must be a positive integer"),
    jobPortals: z
      .number()
      .int()
      .min(0, "Job portals must be a positive integer"),
    socialMedia: z
      .number()
      .int()
      .min(0, "Social media must be a positive integer"),
  }),
  recruitmentChallenges: z
    .string()
    .min(1, "Recruitment challenges are required"),
  generatedBy: z.string().min(1, "Generated by is required"),
  approvalStatus: z.enum(["Pending", "Approved", "Rejected"], {
    message: "Invalid approval status",
  }),
});

// Create Business Performance Report
UpcountryRouter.post(
  "/asaba/business-performance-report",
  authenticateToken,
  async (req, res) => {
    try {
      const validatedData = BusinessPerformanceReportSchema.parse(req.body);

      const report = await prisma.businessPerformanceReport.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json({
        message: "Business performance report created successfully",
        report,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Get All Business Performance Reports
UpcountryRouter.get(
  "/asaba/business-performance-report",
  authenticateToken,
  async (req, res) => {
    try {
      const reports = await prisma.businessPerformanceReport.findMany({
        // where: { userId: req.user.userId }, // Uncomment to filter by user
      });
      res.status(200).json(reports);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Get Single Business Performance Report
UpcountryRouter.get(
  "/asaba/business-performance-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const report = await prisma.businessPerformanceReport.findUnique({
        where: { id },
      });

      if (!report) {
        return res
          .status(404)
          .json({ error: "Business performance report not found" });
      }

      res.status(200).json(report);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Update Business Performance Report
UpcountryRouter.patch(
  "/asaba/business-performance-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = BusinessPerformanceReportSchema.partial().parse(
        req.body
      );

      const updatedReport = await prisma.businessPerformanceReport.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        message: "Business performance report updated successfully",
        report: updatedReport,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Delete Business Performance Report
UpcountryRouter.delete(
  "/asaba/business-performance-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.businessPerformanceReport.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Create Recruitment Report
UpcountryRouter.post(
  "/asaba/recruitment-report",
  authenticateToken,
  async (req, res) => {
    try {
      const validatedData = RecruitmentReportSchema.parse(req.body);

      const report = await prisma.recruitmentReport.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json({
        message: "Recruitment report created successfully",
        report,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Get All Recruitment Reports
UpcountryRouter.get(
  "/asaba/recruitment-report",
  authenticateToken,
  async (req, res) => {
    try {
      const reports = await prisma.recruitmentReport.findMany({
        // where: { userId: req.user.userId }, // Uncomment to filter by user
      });
      res.status(200).json(reports);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Get Single Recruitment Report
UpcountryRouter.get(
  "/asaba/recruitment-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const report = await prisma.recruitmentReport.findUnique({
        where: { id },
      });

      if (!report) {
        return res.status(404).json({ error: "Recruitment report not found" });
      }

      res.status(200).json(report);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Update Recruitment Report
UpcountryRouter.patch(
  "/asaba/recruitment-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = RecruitmentReportSchema.partial().parse(req.body);

      const updatedReport = await prisma.recruitmentReport.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        message: "Recruitment report updated successfully",
        report: updatedReport,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Delete Recruitment Report
UpcountryRouter.delete(
  "/asaba/recruitment-report/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.recruitmentReport.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Gombe Candidate Schema
const GombeCandidateSchema = z.object({
  candidateId: z.string().min(1, "Candidate ID is required"),
  fullName: z.string().min(1, "Full name is required"),
  jobTitleApplied: z.string().min(1, "Job title applied is required"),
  applicationDate: z.coerce.date({ message: "Invalid application date" }),
  recruitmentStatus: z.enum(["Screened", "Interviewed", "Hired", "Rejected"], {
    message: "Invalid recruitment status",
  }),
  phoneNumber: z.string().min(1, "Phone number is required"),
  emailAddress: z.string().email("Invalid email format"),
  resumeUrl: z.string().optional(),
});

// Gombe Client Schema
const GombeClientSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientName: z.string().min(1, "Client name is required"),
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  emailAddress: z.string().email("Invalid email format"),
  businessAddress: z.string().min(1, "Business address is required"),
  clientStatus: z.enum(["Active", "Prospect", "Lost"], {
    message: "Invalid client status",
  }),
});

// Gombe Office Asset Schema
const GombeOfficeAssetSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  deviceType: z.string().min(1, "Device type is required"),
  brandModel: z.string().min(1, "Brand and model is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  assignedTo: z.string().min(1, "Assigned to is required"),
  purchaseDate: z.coerce.date({ message: "Invalid purchase date" }),
  currentStatus: z.enum(["Active", "Under Repair", "Retired"], {
    message: "Invalid current status",
  }),
});

// Create Gombe Candidate
UpcountryRouter.post(
  "/gombe/candidate",
  authenticateToken,
  async (req, res) => {
    try {
      const validatedData = GombeCandidateSchema.parse({
        ...req.body,
        applicationDate: new Date(req.body.applicationDate),
      });

      const candidate = await prisma.gombeCandidate.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json({
        message: "Gombe candidate created successfully",
        candidate,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Get All Gombe Candidates
UpcountryRouter.get("/gombe/candidate", authenticateToken, async (req, res) => {
  try {
    const candidates = await prisma.gombeCandidate.findMany({
      // where: { userId: req.user.userId }, // Uncomment to filter by user
    });
    res.status(200).json(candidates);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get Single Gombe Candidate
UpcountryRouter.get(
  "/gombe/candidate/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const candidate = await prisma.gombeCandidate.findUnique({
        where: { id },
      });

      if (!candidate) {
        return res.status(404).json({ error: "Gombe candidate not found" });
      }

      res.status(200).json(candidate);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Update Gombe Candidate
UpcountryRouter.patch(
  "/gombe/candidate/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = GombeCandidateSchema.partial().parse(req.body);

      const updatedCandidate = await prisma.gombeCandidate.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        message: "Gombe candidate updated successfully",
        candidate: updatedCandidate,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Delete Gombe Candidate
UpcountryRouter.delete(
  "/gombe/candidate/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.gombeCandidate.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Create Gombe Client
UpcountryRouter.post("/gombe/client", authenticateToken, async (req, res) => {
  try {
    const validatedData = GombeClientSchema.parse(req.body);

    const client = await prisma.gombeClient.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "Gombe client created successfully",
      client,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get All Gombe Clients
UpcountryRouter.get("/gombe/client", authenticateToken, async (req, res) => {
  try {
    const clients = await prisma.gombeClient.findMany({
      // where: { userId: req.user.userId }, // Uncomment to filter by user
    });
    res.status(200).json(clients);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Get Single Gombe Client
UpcountryRouter.get(
  "/gombe/client/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const client = await prisma.gombeClient.findUnique({ where: { id } });

      if (!client) {
        return res.status(404).json({ error: "Gombe client not found" });
      }

      res.status(200).json(client);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Update Gombe Client
UpcountryRouter.patch(
  "/gombe/client/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = GombeClientSchema.partial().parse(req.body);

      const updatedClient = await prisma.gombeClient.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        message: "Gombe client updated successfully",
        client: updatedClient,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Delete Gombe Client
UpcountryRouter.delete(
  "/gombe/client/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.gombeClient.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Create Gombe Office Asset
UpcountryRouter.post(
  "/gombe/office-asset",
  authenticateToken,
  async (req, res) => {
    try {
      const validatedData = GombeOfficeAssetSchema.parse({
        ...req.body,
        purchaseDate: new Date(req.body.purchaseDate),
      });

      const asset = await prisma.gombeOfficeAsset.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json({
        message: "Gombe office asset created successfully",
        asset,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Get All Gombe Office Assets
UpcountryRouter.get(
  "/gombe/office-asset",
  authenticateToken,
  async (req, res) => {
    try {
      const assets = await prisma.gombeOfficeAsset.findMany({
        // where: { userId: req.user.userId }, // Uncomment to filter by user
      });
      res.status(200).json(assets);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Get Single Gombe Office Asset
UpcountryRouter.get(
  "/gombe/office-asset/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const asset = await prisma.gombeOfficeAsset.findUnique({ where: { id } });

      if (!asset) {
        return res.status(404).json({ error: "Gombe office asset not found" });
      }

      res.status(200).json(asset);
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Update Gombe Office Asset
UpcountryRouter.patch(
  "/gombe/office-asset/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = GombeOfficeAssetSchema.partial().parse(req.body);

      const updatedAsset = await prisma.gombeOfficeAsset.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        message: "Gombe office asset updated successfully",
        asset: updatedAsset,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// Delete Gombe Office Asset
UpcountryRouter.delete(
  "/gombe/office-asset/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.gombeOfficeAsset.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);
export { UpcountryRouter };
