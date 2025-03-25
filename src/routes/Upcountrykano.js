import express from "express";
// import { authenticateToken, authorizeRole } from "../middlewares/userauth.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticateToken, authorizeRole } from "../middlewares/userauth.js";

const prisma = new PrismaClient();
const kanorouter = express.Router();

// Configure file upload directory

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go up one directory to src from routes folder
const SRC_DIR = path.resolve(__dirname, "../");
const UPLOADS_DIR = path.join(SRC_DIR, "uploads");

// Ensure subdirectories exist
const createUploadDirs = () => {
  const subDirs = [
    "resumes",
    "certificates",
    "references",
    "background-checks",
  ];
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  subDirs.forEach((dir) => {
    const dirPath = path.join(UPLOADS_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};
createUploadDirs();

console.log(`Candidate routes using uploads directory: ${UPLOADS_DIR}`);

// File upload handler
const handleFileUpload = async (file, subfolder) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(
      `Invalid file type for ${file.name}. Only PDF, DOC, DOCX, JPEG, or PNG allowed.`
    );
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const uploadPath = path.join(UPLOADS_DIR, subfolder, fileName);
  await fs.promises.writeFile(uploadPath, file.data);
  return `/uploads/candidates/${subfolder}/${fileName}`;
};

export const CandidateDocumentSchema = z.object({
  candidateName: z.string().min(1, "Candidate name is required"),
  applicationID: z.string().min(1, "Application ID is required"),
  jobTitleAppliedFor: z.string().min(1, "Job title is required"),
  resumeCV: z.string().optional(),
  educationalCertificates: z.array(z.string()).optional(),
  referenceLetters: z.array(z.string()).optional(),
  backgroundCheckReports: z.array(z.string()).optional(),
  recruitmentStatus: z.enum(["Screened", "Interviewed", "Hired", "Rejected"]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userId: z.string().min(1, "User ID is required"),
});

export const FleetSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  vehicleTypeModel: z.string().min(1, "Vehicle type/model is required"),
  licensePlateNumber: z.string().min(1, "License plate is required"),
  currentStatus: z.enum(["Active", "Under Repair", "Retired"]),
  lastMaintenanceDate: z.coerce.date(),
  assignedDriver: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  //   userId: z.string().min(1, "User ID is required"),
});

export const ApplicantSchema = z.object({
  candidateName: z.string().min(1, "Candidate name is required"),
  applicationID: z.string().min(1, "Application ID is required"),
  jobTitleAppliedFor: z.string().min(1, "Job title is required"),
  dateOfApplication: z.coerce.date(),
  recruitmentStatus: z.enum(["Screened", "Interviewed", "Hired", "Rejected"]),
  assignedRecruiter: z.string().min(1, "Recruiter ID is required"),
});

export const ClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyName: z.string().optional(),
  contactPerson: z.string().min(1, "Contact person is required"),
  phoneNumber: z.string().min(6, "Valid phone number required"),
  email: z.string().email("Valid email required"),
  businessAddress: z.string().min(1, "Address is required"),
  status: z.enum(["Active", "Prospect", "Lost"]),
  accountManager: z.string().min(1, "Account manager ID is required"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const ComplianceSchema = z.object({
  documentType: z.enum([
    "Tax Clearance",
    "Business Registration",
    "Compliance Certificate",
  ]),
  issuingBody: z.string().min(1, "Issuing body is required"),
  dateIssued: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
  companyName: z.string().min(1, "Company name is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  approvalStatus: z.enum(["Pending", "Approved", "Rejected"]),
  createdAt: z.date().optional(),
});

const OnboardedStaffSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  fullName: z.string().min(1, "Full name is required"),
  resumptionForm: z.string().min(1, "Resumption form path is required"),
  bankAccountDetails: z.object({
    accountNumber: z.string().length(10, "Must be 10 digits"),
    bankName: z.string().min(1, "Bank name is required"),
  }),
  bvn: z.string().length(11, "BVN must be 11 digits"),
  pfaDetails: z.object({
    pfaName: z.string().min(1, "PFA name is required"),
    rsaNumber: z.string().min(1, "RSA number is required"),
  }),
  officialEmail: z.string().email("Invalid email format"),
  officialPhone: z.string().min(11, "Phone must be at least 11 digits"),
  emergencyContact: z.object({
    name: z.string().min(1, "Name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().min(11, "Phone must be at least 11 digits"),
  }),
  //   userId: z.string().min(1, "User ID is required"),
});

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

// CREATE Candidate with file uploads
kanorouter.post(
  "/candidates",
  authenticateToken,
  //   authorizeRole(["recruiter", "admin"]),
  async (req, res) => {
    try {
      if (!req.files) {
        throw new Error("No files uploaded");
      }

      // Process all file uploads
      const fileUploads = {
        resume: req.files.resume
          ? await handleFileUpload(req.files.resume, "resumes")
          : null,
        certificates: req.files.certificates
          ? await Promise.all(
              Array.isArray(req.files.certificates)
                ? req.files.certificates.map((f) =>
                    handleFileUpload(f, "certificates")
                  )
                : [handleFileUpload(req.files.certificates, "certificates")]
            )
          : [],
        referenceLetters: req.files.referenceLetters
          ? await Promise.all(
              Array.isArray(req.files.referenceLetters)
                ? req.files.referenceLetters.map((f) =>
                    handleFileUpload(f, "references")
                  )
                : [handleFileUpload(req.files.referenceLetters, "references")]
            )
          : [],
        backgroundChecks: req.files.backgroundChecks
          ? await Promise.all(
              Array.isArray(req.files.backgroundChecks)
                ? req.files.backgroundChecks.map((f) =>
                    handleFileUpload(f, "background-checks")
                  )
                : [
                    handleFileUpload(
                      req.files.backgroundChecks,
                      "background-checks"
                    ),
                  ]
            )
          : [],
      };

      // Validate and create candidate
      const validatedData = CandidateDocumentSchema.parse({
        ...req.body,
        resumeCV: fileUploads.resume,
        educationalCertificates: fileUploads.certificates,
        referenceLetters: fileUploads.referenceLetters,
        backgroundCheckReports: fileUploads.backgroundChecks,
        userId: req.user.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const candidate = await prisma.KanoCandidateDocument.create({
        data: validatedData,
      });

      // Generate full URLs for response
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const responseData = {
        ...candidate,
        resumeCV: candidate.resumeCV ? `${baseUrl}${candidate.resumeCV}` : null,
        educationalCertificates: candidate.educationalCertificates?.map(
          (url) => `${baseUrl}${url}`
        ),
        referenceLetters: candidate.referenceLetters?.map(
          (url) => `${baseUrl}${url}`
        ),
        backgroundCheckReports: candidate.backgroundCheckReports?.map(
          (url) => `${baseUrl}${url}`
        ),
      };

      res.status(201).json({
        success: true,
        message: "Candidate created successfully",
        data: responseData,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

kanorouter.patch(
  "/candidates/:id",
  authenticateToken,
  authorizeRole(["recruiter", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      let updateData = { ...req.body, updatedAt: new Date() };

      // 1. Handle File Uploads if present
      const fileUploads = {};
      if (req.files) {
        if (req.files.resume) {
          fileUploads.resumeCV = await handleFileUpload(
            req.files.resume,
            "resumes"
          );
        }
        if (req.files.certificates) {
          fileUploads.educationalCertificates = await Promise.all(
            Array.isArray(req.files.certificates)
              ? req.files.certificates.map((f) =>
                  handleFileUpload(f, "certificates")
                )
              : [handleFileUpload(req.files.certificates, "certificates")]
          );
        }
        if (req.files.referenceLetters) {
          fileUploads.referenceLetters = await Promise.all(
            Array.isArray(req.files.referenceLetters)
              ? req.files.referenceLetters.map((f) =>
                  handleFileUpload(f, "references")
                )
              : [handleFileUpload(req.files.referenceLetters, "references")]
          );
        }
        if (req.files.backgroundChecks) {
          fileUploads.backgroundCheckReports = await Promise.all(
            Array.isArray(req.files.backgroundChecks)
              ? req.files.backgroundChecks.map((f) =>
                  handleFileUpload(f, "background-checks")
                )
              : [
                  handleFileUpload(
                    req.files.backgroundChecks,
                    "background-checks"
                  ),
                ]
          );
        }
      }

      // 2. Validate only provided fields
      const validatedData = CandidateDocumentSchema.partial().parse({
        ...updateData,
        ...fileUploads,
      });

      // 3. Fetch current data to handle file deletions
      const currentCandidate = await prisma.KanoCandidateDocument.findUnique({
        where: { id },
      });
      if (!currentCandidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      // 4. Prepare update payload
      const updatePayload = { ...validatedData };

      // 5. Update database
      const updatedCandidate = await prisma.KanoCandidateDocument.update({
        where: { id },
        data: updatePayload,
      });

      // 6. Generate response with full URLs
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const responseData = {
        ...updatedCandidate,
        resumeCV: updatedCandidate.resumeCV
          ? `${baseUrl}${updatedCandidate.resumeCV}`
          : null,
        educationalCertificates: updatedCandidate.educationalCertificates?.map(
          (url) => `${baseUrl}${url}`
        ),
        referenceLetters: updatedCandidate.referenceLetters?.map(
          (url) => `${baseUrl}${url}`
        ),
        backgroundCheckReports: updatedCandidate.backgroundCheckReports?.map(
          (url) => `${baseUrl}${url}`
        ),
      };

      res.status(200).json({
        success: true,
        message: "Candidate updated successfully",
        updatedFields: Object.keys(validatedData),
        data: responseData,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// GET all candidates
kanorouter.get("/candidates", authenticateToken, async (req, res) => {
  try {
    const candidates = await prisma.KanoCandidateDocument.findMany({
      //   where: { userId: req.user.userId },
    });

    res.status(200).json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// GET single candidate
kanorouter.get("/candidates/:id", authenticateToken, async (req, res) => {
  try {
    const candidate = await prisma.KanoCandidateDocument.findUnique({
      where: { id: req.params.id },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// DELETE candidate
kanorouter.delete("/candidates/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.KanoCandidateDocument.delete({
      where: { id: req.params.id },
    });

    res.status(204).end();
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// CREATE Fleet
kanorouter.post("/fleet", authenticateToken, async (req, res) => {
  try {
    const validatedData = FleetSchema.parse({
      ...req.body,
      lastMaintenanceDate: new Date(req.body.lastMaintenanceDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fleet = await prisma.KanoFleet.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Fleet record created successfully",
      data: fleet,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

kanorouter.get("/fleet", authenticateToken, async (req, res) => {
  try {
    const fleet = await prisma.KanoFleet.findMany();
    res.status(200).json({
      success: true,
      data: fleet,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

kanorouter.get("/fleet/:id", authenticateToken, async (req, res) => {
  try {
    const fleet = await prisma.KanoFleet.findUnique({
      where: { id: req.params.id },
    });

    if (!fleet) {
      return res.status(404).json({ error: "Fleet record not found" });
    }

    res.status(200).json({
      success: true,
      data: fleet,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

kanorouter.delete("/fleet/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.KanoFleet.delete({
      where: { id: req.params.id },
    });
    res.status(204).end();
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

kanorouter.patch("/fleet/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. First check if the record exists
    const existingFleet = await prisma.kanoFleet.findUnique({
      where: { id },
    });

    if (!existingFleet) {
      return res.status(404).json({
        success: false,
        error: "Fleet record not found",
        message: `No fleet found with ID: ${id}`,
      });
    }

    // 2. Prepare update data
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // 3. Handle date conversion if present
    if (req.body.lastMaintenanceDate) {
      updateData.lastMaintenanceDate = new Date(req.body.lastMaintenanceDate);
    }

    // 4. Validate only provided fields
    const validatedData = FleetSchema.partial().parse(updateData);

    // 5. Execute update
    const updatedFleet = await prisma.kanoFleet.update({
      where: { id },
      data: validatedData,
    });

    // 6. Return success response
    res.status(200).json({
      success: true,
      message: "Fleet updated successfully",
      updatedFields: Object.keys(validatedData),
      data: updatedFleet,
    });
  } catch (error) {
    // Handle specific Prisma errors
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Record not found",
        message: "The fleet record you're trying to update doesn't exist",
      });
    }
    handleErrorResponse(error, res);
  }
});

kanorouter.post("/ats", authenticateToken, async (req, res) => {
  try {
    const validatedData = ApplicantSchema.parse({
      ...req.body,
      dateOfApplication: new Date(req.body.dateOfApplication || Date.now()),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const applicant = await prisma.KanoApplicant.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Applicant created successfully",
      data: applicant,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

kanorouter.patch(
  "/ats/:id",
  authenticateToken,
  authorizeRole(["recruiter", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Check if applicant exists
      const existingApplicant = await prisma.KanoApplicant.findUnique({
        where: { id },
      });

      if (!existingApplicant) {
        return res.status(404).json({
          success: false,
          error: "Applicant not found",
          message: `No applicant found with Application ID: ${id}`,
        });
      }

      // 2. Prepare update data (only include provided fields)
      const updateData = {
        ...req.body,
        updatedAt: new Date(), // Always update timestamp
      };

      // 3. Handle date conversion if present
      if (req.body.dateOfApplication) {
        updateData.dateOfApplication = new Date(req.body.dateOfApplication);
      }

      // 4. Validate ONLY provided fields
      const validatedData = ApplicantSchema.partial().parse(updateData);

      // 5. Execute update
      const updatedApplicant = await prisma.KanoApplicant.update({
        where: { id },
        data: validatedData,
      });

      // 6. Return success response
      res.status(200).json({
        success: true,
        message: "Applicant updated successfully",
        updatedFields: Object.keys(validatedData),
        data: updatedApplicant,
      });
    } catch (error) {
      // Handle specific Prisma errors
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Record not found",
          message: "The applicant record doesn't exist",
        });
      }
      handleErrorResponse(error, res);
    }
  }
);

kanorouter.get("/ats", authenticateToken, async (req, res) => {
  try {
    const { status, recruiter } = req.query;

    const where = {};
    if (status) where.recruitmentStatus = status;
    if (recruiter) where.assignedRecruiter = recruiter;

    const applicants = await prisma.KanoApplicant.findMany({
      where,
      orderBy: { dateOfApplication: "desc" },
    });

    res.status(200).json({
      success: true,
      count: applicants.length,
      data: applicants,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

kanorouter.get("/ats/:id", authenticateToken, async (req, res) => {
  try {
    const applicant = await prisma.KanoApplicant.findUnique({
      where: { id: req.params.id },
    });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Applicant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: applicant,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// DELETE Applicant
kanorouter.delete(
  "/ats/:id",
  authenticateToken,
  // authorizeRole(["admin"]),
  async (req, res) => {
    try {
      await prisma.KanoApplicant.delete({
        where: { id: req.params.id },
      });

      res.status(204).end();
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Applicant already deleted or doesn't exist",
        });
      }
      handleErrorResponse(error, res);
    }
  }
);

kanorouter.post(
  "/KanoClient",
  authenticateToken,
  //   authorizeRole(["account_manager", "admin"]),
  async (req, res) => {
    try {
      const validatedData = ClientSchema.parse({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const client = await prisma.KanoClient.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json({
        success: true,
        message: "Client created successfully",
        data: client,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

kanorouter.get("/KanoClient", authenticateToken, async (req, res) => {
  try {
    const clients = await prisma.KanoClient.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// PATCH Client (Partial Update)
kanorouter.patch(
  "/KanoClient/:id",
  authenticateToken,
  // authorizeRole(["account_manager", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = ClientSchema.partial().parse({
        ...req.body,
        updatedAt: new Date(),
      });

      const updatedClient = await prisma.KanoClient.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json({
        success: true,
        message: "Client updated successfully",
        updatedFields: Object.keys(validatedData),
        data: updatedClient,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

// DELETE Applicant
kanorouter.delete(
  "/KanoClient/:id",
  authenticateToken,
  // authorizeRole(["admin"]),
  async (req, res) => {
    try {
      await prisma.KanoClient.delete({
        where: { id: req.params.id },
      });

      res.status(204).end();
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Applicant already deleted or doesn't exist",
        });
      }
      handleErrorResponse(error, res);
    }
  }
);

kanorouter.post(
  "/KanoComplianceDocument",
  authenticateToken,
  //  authorizeRole(["compliance_officer", "admin"]),
  async (req, res) => {
    try {
      const validatedData = ComplianceSchema.parse({
        ...req.body,
        dateIssued: new Date(req.body.dateIssued),
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
        createdAt: new Date(),
      });

      const doc = await prisma.KanoComplianceDocument.create({
        data: {
          ...validatedData,
          userId: req.user.userId,
        },
      });

      res.status(201).json({
        success: true,
        message: "Document recorded successfully",
        data: doc,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

kanorouter.get(
  "/KanoComplianceDocument",
  authenticateToken,
  async (req, res) => {
    try {
      const { status, manager } = req.query;
      const where = {};
      if (status) where.status = status;
      if (manager) where.accountManager = manager;

      const clients = await prisma.KanoComplianceDocument.findMany();

      res.status(200).json({
        success: true,
        count: clients.length,
        data: clients,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

kanorouter.patch(
  "/KanoComplianceDocument/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Check if document exists
      const existingDoc = await prisma.KanoComplianceDocument.findUnique({
        where: { id },
      });

      if (!existingDoc) {
        return res.status(404).json({
          success: false,
          error: "Document not found",
        });
      }

      // 2. Prepare update data (only include provided fields)
      const updateData = {
        ...req.body,
        updatedAt: new Date(),
      };

      // 3. Handle date conversions if provided
      if (req.body.dateIssued) {
        updateData.dateIssued = new Date(req.body.dateIssued);
      }
      if (req.body.expiryDate) {
        updateData.expiryDate = new Date(req.body.expiryDate);
      }

      // 4. Validate ONLY provided fields
      const validationRules = ComplianceSchema.partial();
      const validatedData = validationRules.parse(updateData);

      // 5. Execute update
      const updatedDoc = await prisma.KanoComplianceDocument.update({
        where: { id },
        data: validatedData,
      });

      // 6. Return response
      res.status(200).json({
        success: true,
        message: "Document updated successfully",
        updatedFields: Object.keys(validatedData),
        data: updatedDoc,
      });
    } catch (error) {
      handleErrorResponse(error, res);
    }
  }
);

kanorouter.delete(
  "/KanoComplianceDocument/:id",
  authenticateToken,
  // authorizeRole(["admin"]),
  async (req, res) => {
    try {
      await prisma.KanoComplianceDocument.delete({
        where: { id: req.params.id },
      });

      res.status(204).end();
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Applicant already deleted or doesn't exist",
        });
      }
      handleErrorResponse(error, res);
    }
  }
);

kanorouter.post("/staff", authenticateToken, async (req, res) => {
  try {
    const validatedData = OnboardedStaffSchema.parse({
      ...req.body,
      userId: req.user.userId,
    });

    const staff = await prisma.onboardedStaff.create({
      data: validatedData,
    });

    res.status(201).json(staff);
  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// READ ALL
kanorouter.get("/staff", authenticateToken, async (req, res) => {
  try {
    const staff = await prisma.onboardedStaff.findMany({
      // where: { userId: req.user.userId }
    });
    res.json(staff);
  } catch (error) {
    handleError(error, res);
  }
});

kanorouter.patch("/staff/:id", authenticateToken, async (req, res) => {
  try {
    const validatedData = OnboardedStaffSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.onboardedStaff.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ error: "Staff record not found" });
    }

    const updatedStaff = await prisma.onboardedStaff.update({
      where: { id: req.params.id },
      data: validatedData,
    });

    res.json({
      message: "Staff record updated",
      updatedFields: Object.keys(validatedData),
      staff: updatedStaff,
    });
  } catch (error) {
    // handleError(error, res);
    handleErrorResponse(error, res);
  }
});

// DELETE
kanorouter.delete("/staff/:id", authenticateToken, async (req, res) => {
  try {
    // Verify ownership
    const existing = await prisma.onboardedStaff.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ error: "Staff record not found" });
    }

    await prisma.onboardedStaff.delete({
      where: { id: req.params.id },
    });

    res.status(204).end();
  } catch (error) {
    handleError(error, res);
  }
});

export { kanorouter };
