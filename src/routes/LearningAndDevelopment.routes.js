import express from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { authenticateToken, authorizeRole } from "../middlewares/userauth.js";

const prisma = new PrismaClient();
const LearningAndDevelopmentRouter = express.Router();

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["employee1", "employee2", "employee3"]),
});

const clientInfoSchema = z.object({
  clientName: z.string().min(1, "Client Name is required"),
  companyName: z.string().min(1, "Company Name is required"),
  industry: z.string().min(1, "Industry is required"),
  businessType: z.string().min(1, "Business Type is required"),
  location: z.string().min(1, "Location is required"),
  contactPerson: z.string().min(1, "Contact Person is required"),
  contactEmail: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
});

// Outsourced Training Schema
const outsourcedTrainingSchema = z.object({
  trainingTitle: z.string().min(1, "Training Title is required"),
  trainingProvider: z.string().min(1, "Training Provider is required"),
  trainingType: z.string().min(1, "Training Type is required"),
  trainingCategory: z.string().min(1, "Training Category is required"),
  targetAudience: z.string().min(1, "Target Audience is required"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  trainingLocation: z.string().optional(),
});

const participantSchema = z.object({
  participantName: z.string().min(1, "Participant Name is required"),
  jobRole: z.string().min(1, "Job Role is required"),
  department: z.string().min(1, "Department is required"),
  companyName: z.string().optional(),
  emailAddress: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
});

const participantsArraySchema = z.array(participantSchema);
// Training Content Schema
const trainingContentSchema = z.object({
  modulesCovered: z.array(z.string()),
  facilitatorNames: z.array(z.string()),
  modeOfDelivery: z.string().min(1, "Mode of Delivery is required"),
  materialsProvided: z.array(z.string()),
});

// Evaluation Schema
const evaluationSchema = z.object({
  feedbackScore: z.number().int().min(1).max(10),
  keyLearnings: z.array(z.string()),
  challenges: z.array(z.string()),
  suggestions: z.array(z.string()),
  certificationProvided: z.boolean(),
});

// Cost Schema
const costSchema = z.object({
  trainingFee: z.number().positive("Training fee must be positive"),
  paymentStatus: z.string().min(1, "Payment Status is required"),
  paymentDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid payment date",
    })
    .optional(),
  modeOfPayment: z.string().min(1, "Mode of Payment is required"),
});

// Internal Training Schema
const internalTrainingSchema = z.object({
  trainingTitle: z.string().min(1, "Training Title is required"),
  trainingObjective: z.string().min(1, "Training Objective is required"),
  trainingCategory: z.string().min(1, "Training Category is required"),
  targetAudience: z.string().min(1, "Target Audience is required"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  trainingMode: z.string().min(1, "Training Mode is required"),
  trainingLocation: z.string().optional(),
});

// Internal Participant Schema
const internalParticipantSchema = z.object({
  employeeName: z.string().min(1, "Employee Name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().min(1, "Department is required"),
  jobRole: z.string().min(1, "Job Role is required"),
  emailAddress: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  attendanceStatus: z.string().min(1, "Attendance Status is required"),
});

const internalParticipantsArraySchema = z.array(internalParticipantSchema);

// Internal Training Content Schema
const internalTrainingContentSchema = z.object({
  modulesCovered: z.array(z.string()),
  facilitatorNames: z.array(z.string()),
  materialsProvided: z.array(z.string()),
  methodology: z.string().min(1, "Methodology is required"),
});

// Internal Evaluation Schema
const internalEvaluationSchema = z.object({
  preTrainingScore: z.number().optional(),
  postTrainingScore: z.number().optional(),
  feedbackScore: z.number().int().min(1).max(10),
  keyLearnings: z.array(z.string()),
  challenges: z.array(z.string()),
  suggestions: z.array(z.string()),
  certificationProvided: z.boolean(),
});

// Internal Cost Schema
const internalCostSchema = z.object({
  trainingCost: z.number().optional(),
  budgetAllocation: z.number().optional(),
  approvalStatus: z.string().min(1, "Approval Status is required"),
});

// Internal Training Schema (for updates)
const internalTrainingUpdateSchema = z.object({
  trainingTitle: z.string().min(1, "Training Title is required").optional(),
  trainingObjective: z
    .string()
    .min(1, "Training Objective is required")
    .optional(),
  trainingCategory: z
    .string()
    .min(1, "Training Category is required")
    .optional(),
  targetAudience: z.string().min(1, "Target Audience is required").optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" })
    .optional(),
  trainingMode: z.string().min(1, "Training Mode is required").optional(),
  trainingLocation: z.string().optional(),
});

// Internal Participant Schema (for updates)
const internalParticipantUpdateSchema = z.object({
  employeeName: z.string().min(1, "Employee Name is required").optional(),
  employeeId: z.string().min(1, "Employee ID is required").optional(),
  department: z.string().min(1, "Department is required").optional(),
  jobRole: z.string().min(1, "Job Role is required").optional(),
  emailAddress: z.string().email("Invalid email address").optional(),
  phoneNumber: z.string().min(1, "Phone Number is required").optional(),
  attendanceStatus: z
    .string()
    .min(1, "Attendance Status is required")
    .optional(),
});

// Internal Training Content Schema (for updates)
const internalTrainingContentUpdateSchema = z.object({
  modulesCovered: z.array(z.string()).optional(),
  facilitatorNames: z.array(z.string()).optional(),
  materialsProvided: z.array(z.string()).optional(),
  methodology: z.string().min(1, "Methodology is required").optional(),
});

// Internal Evaluation Schema (for updates)
const internalEvaluationUpdateSchema = z.object({
  preTrainingScore: z.number().optional(),
  postTrainingScore: z.number().optional(),
  feedbackScore: z.number().int().min(1).max(10).optional(),
  keyLearnings: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
  certificationProvided: z.boolean().optional(),
});

// Internal Cost Schema (for updates)
const internalCostUpdateSchema = z.object({
  trainingCost: z.number().optional(),
  budgetAllocation: z.number().optional(),
  approvalStatus: z.string().min(1, "Approval Status is required").optional(),
});

LearningAndDevelopmentRouter.post(
  "/clients",
  authenticateToken,
  async (req, res) => {
    try {
      // Validate request data
      const validatedData = clientInfoSchema.parse(req.body);

      // Add userId from the authenticated user
      const newClient = await prisma.clientInfo.create({
        data: {
          ...validatedData,
          userId: req.user.userId, // From authenticateToken middleware
        },
      });

      res.status(201).json(newClient);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

LearningAndDevelopmentRouter.get(
  "/clients",
  authenticateToken,
  async (req, res) => {
    try {
      const clients = await prisma.clientInfo.findMany({
        // where: {
        // Optionally filter by user if needed
        // userId: req.user.userId
        // },
      });
      res.status(200).json(clients);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

LearningAndDevelopmentRouter.get(
  "/clients/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const client = await prisma.clientInfo.findUnique({
        where: { id },
      });

      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.status(200).json(client);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

LearningAndDevelopmentRouter.put(
  "/clients/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = clientInfoSchema.parse(req.body);

      // Verify the client belongs to the user
      const existingClient = await prisma.clientInfo.findUnique({
        where: { id },
      });

      if (!existingClient) {
        return res.status(404).json({ error: "Client not found" });
      }

      if (existingClient.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to update this client" });
      }

      const updatedClient = await prisma.clientInfo.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json(updatedClient);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete a client
LearningAndDevelopmentRouter.delete(
  "/clients/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify the client belongs to the user
      const existingClient = await prisma.clientInfo.findUnique({
        where: { id },
      });

      if (!existingClient) {
        return res.status(404).json({ error: "Client not found" });
      }

      if (existingClient.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to delete this client" });
      }

      await prisma.clientInfo.delete({
        where: { id },
      });

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
// Upd

// =============== OUTSOURCED TRAINING ROUTES ===============

// Create a new    training with nested data
LearningAndDevelopmentRouter.post(
  "/outsourced-trainings",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        training,
        participants = [],
        trainingContent,
        evaluation,
        cost,
      } = req.body;

      // Validate main training data
      const validatedTraining = outsourcedTrainingSchema.parse(training);

      // Validate nested data
      const validatedParticipants = participantsArraySchema.parse(participants);
      const validatedTrainingContent =
        trainingContentSchema.parse(trainingContent);
      const validatedEvaluation = evaluationSchema.parse(evaluation);
      const validatedCost = costSchema.parse(cost);

      // Create the training with all related data
      const newTraining = await prisma.outsourcedTraining.create({
        data: {
          ...validatedTraining,
          startDate: new Date(validatedTraining.startDate),
          endDate: new Date(validatedTraining.endDate),
          userId: req.user.userId,
          participants: {
            create: validatedParticipants.map((participant) => ({
              ...participant,
              userId: req.user.userId,
            })),
          },
          trainingContent: {
            create: {
              ...validatedTrainingContent,
              userId: req.user.userId,
            },
          },
          evaluation: {
            create: {
              ...validatedEvaluation,
              userId: req.user.userId,
            },
          },
          cost: {
            create: {
              ...validatedCost,
              paymentDate: validatedCost.paymentDate
                ? new Date(validatedCost.paymentDate)
                : null,
              userId: req.user.userId,
            },
          },
        },
        include: {
          participants: true,
          trainingContent: true,
          evaluation: true,
          cost: true,
        },
      });

      res.status(201).json(newTraining);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all outsourced trainings
LearningAndDevelopmentRouter.get(
  "/outsourced-trainings",
  authenticateToken,
  async (req, res) => {
    try {
      const trainings = await prisma.outsourcedTraining.findMany({
        // where: {
        //   userId: req.user.userId,
        // },
        include: {
          participants: true,
          trainingContent: true,
          evaluation: true,
          cost: true,
        },
      });

      res.status(200).json(trainings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

LearningAndDevelopmentRouter.get(
  "/outsourced-trainings/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const training = await prisma.outsourcedTraining.findUnique({
        where: { id },
        include: {
          participants: true,
          trainingContent: true,
          evaluation: true,
          cost: true,
        },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      // Check if the training belongs to the user
      if (training.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to view this training" });
      }

      res.status(200).json(training);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// we did not creat delete and update for outsourcing traning

// =============== PARTICIPANT ROUTES ===============
// Add a participant to an outsourced training
LearningAndDevelopmentRouter.post(
  "/participants",
  authenticateToken,
  async (req, res) => {
    try {
      const { trainingId, ...participantData } = req.body;

      if (!trainingId) {
        return res.status(400).json({ error: "Training ID is required" });
      }

      // Validate participant data
      const validatedData = participantSchema.parse(participantData);

      // Verify the training exists and belongs to the user
      const training = await prisma.outsourcedTraining.findUnique({
        where: { id: trainingId },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      if (training.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to add participants to this training" });
      }

      // Create the participant
      const newParticipant = await prisma.participant.create({
        data: {
          ...validatedData,
          trainingId,
          userId: req.user.userId,
        },
      });

      res.status(201).json(newParticipant);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);
// Get participants for a training
LearningAndDevelopmentRouter.get(
  "/trainings/:trainingId/participants",
  authenticateToken,
  async (req, res) => {
    try {
      const { trainingId } = req.params;

      // Verify the training exists and belongs to the user
      const training = await prisma.outsourcedTraining.findUnique({
        where: { id: trainingId },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      if (training.userId !== req.user.userId) {
        return res.status(403).json({
          error: "Unauthorized to view participants of this training",
        });
      }

      // Get participants
      const participants = await prisma.participant.findMany({
        where: { trainingId },
      });

      res.status(200).json(participants);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update a participant
LearningAndDevelopmentRouter.put(
  "/participants/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = participantSchema.parse(req.body);

      // Verify the participant exists and belongs to the user
      const existingParticipant = await prisma.participant.findUnique({
        where: { id },
      });

      if (!existingParticipant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      if (existingParticipant.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to update this participant" });
      }

      // Update the participant
      const updatedParticipant = await prisma.participant.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json(updatedParticipant);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete a participant
LearningAndDevelopmentRouter.delete(
  "/participants/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verify the participant exists and belongs to the user
      const existingParticipant = await prisma.participant.findUnique({
        where: { id },
      });

      if (!existingParticipant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      if (existingParticipant.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to delete this participant" });
      }

      // Delete the participant
      await prisma.participant.delete({
        where: { id },
      });

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// =============== TRAINING CONTENT ROUTES ===============

// Add training content to an outsourced training
LearningAndDevelopmentRouter.post(
  "/training-content",
  authenticateToken,
  async (req, res) => {
    try {
      const { trainingId, ...contentData } = req.body;

      if (!trainingId) {
        return res.status(400).json({ error: "Training ID is required" });
      }

      // Validate training content data
      const validatedData = trainingContentSchema.parse(contentData);

      // Verify the training exists and belongs to the user
      const training = await prisma.outsourcedTraining.findUnique({
        where: { id: trainingId },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      // if (training.userId !== req.user.userId) {
      //   return res
      //     .status(403)
      //     .json({ error: "Unauthorized to add content to this training" });
      // }

      // Create the training content
      const newContent = await prisma.trainingContent.create({
        data: {
          ...validatedData,
          trainingId,
          userId: req.user.userId,
        },
      });

      res.status(201).json(newContent);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// Get training content for a training
LearningAndDevelopmentRouter.get(
  "/trainings/:trainingId/content",
  authenticateToken,
  async (req, res) => {
    try {
      const { trainingId } = req.params;

      // Verify the training exists and belongs to the user
      const training = await prisma.outsourcedTraining.findUnique({
        where: { id: trainingId },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      // if (training.userId !== req.user.userId) {
      //   return res.status(403).json({ error: "Unauthorized to view content of this training" });
      // }

      // Get training content
      const content = await prisma.trainingContent.findFirst({
        where: { trainingId },
      });

      if (!content) {
        return res.status(404).json({ error: "Training content not found" });
      }

      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update training content
LearningAndDevelopmentRouter.put(
  "/training-content/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = trainingContentSchema.parse(req.body);

      // Verify the content exists and belongs to the user
      const existingContent = await prisma.trainingContent.findUnique({
        where: { id },
      });

      if (!existingContent) {
        return res.status(404).json({ error: "Training content not found" });
      }

      if (existingContent.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to update this training content" });
      }

      // Update the training content
      const updatedContent = await prisma.trainingContent.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json(updatedContent);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// =============== EVALUATION ROUTES ===============

// Add evaluation to an outsourced training
LearningAndDevelopmentRouter.post(
  "/evaluations",
  authenticateToken,
  async (req, res) => {
    try {
      const { trainingId, ...evaluationData } = req.body;

      if (!trainingId) {
        return res.status(400).json({ error: "Training ID is required" });
      }

      // Validate evaluation data
      const validatedData = evaluationSchema.parse(evaluationData);

      // Verify the training exists and belongs to the user
      const training = await prisma.outsourcedTraining.findUnique({
        where: { id: trainingId },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      if (training.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to add evaluation to this training" });
      }

      // Create the evaluation
      const newEvaluation = await prisma.evaluation.create({
        data: {
          ...validatedData,
          trainingId,
          userId: req.user.userId,
        },
      });

      res.status(201).json(newEvaluation);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// Get evaluation for a training
LearningAndDevelopmentRouter.get(
  "/trainings/:trainingId/evaluation",
  authenticateToken,
  async (req, res) => {
    try {
      const { trainingId } = req.params;

      // Verify the training exists and belongs to the user
      const training = await prisma.outsourcedTraining.findUnique({
        where: { id: trainingId },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      // if (training.userId !== req.user.userId) {
      //   return res.status(403).json({ error: "Unauthorized to view evaluation of this training" });
      // }

      // Get evaluation
      const evaluation = await prisma.evaluation.findFirst({
        where: { trainingId },
      });

      if (!evaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      res.status(200).json(evaluation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update evaluation
LearningAndDevelopmentRouter.put(
  "/evaluations/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = evaluationSchema.parse(req.body);

      // Verify the evaluation exists and belongs to the user
      const existingEvaluation = await prisma.evaluation.findUnique({
        where: { id },
      });

      if (!existingEvaluation) {
        return res.status(404).json({ error: "Evaluation not found" });
      }

      // if (existingEvaluation.userId !== req.user.userId) {
      //   return res
      //     .status(403)
      //     .json({ error: "Unauthorized to update this evaluation" });
      // }

      // Update the evaluation
      const updatedEvaluation = await prisma.evaluation.update({
        where: { id },
        data: validatedData,
      });

      res.status(200).json(updatedEvaluation);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// =============== COST ROUTES ===============

// Add cost to an outsourced training
LearningAndDevelopmentRouter.post(
  "/costs",
  authenticateToken,
  async (req, res) => {
    try {
      const { trainingId, ...costData } = req.body;

      if (!trainingId) {
        return res.status(400).json({ error: "Training ID is required" });
      }

      // Validate cost data
      const validatedData = costSchema.parse(costData);

      // Verify the training exists and belongs to the user
      const training = await prisma.outsourcedTraining.findUnique({
        where: { id: trainingId },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      if (training.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to add cost to this training" });
      }

      // Create the cost
      const newCost = await prisma.cost.create({
        data: {
          ...validatedData,
          paymentDate: validatedData.paymentDate
            ? new Date(validatedData.paymentDate)
            : null,
          trainingId,
          userId: req.user.userId,
        },
      });

      res.status(201).json(newCost);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// Get cost for a training
LearningAndDevelopmentRouter.get(
  "/trainings/:trainingId/cost",
  authenticateToken,
  async (req, res) => {
    try {
      const { trainingId } = req.params;

      // Verify the training exists and belongs to the user
      const training = await prisma.outsourcedTraining.findUnique({
        where: { id: trainingId },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      // if (training.userId !== req.user.userId) {
      //   return res
      //     .status(403)
      //     .json({ error: "Unauthorized to view cost of this training" });
      // }

      // Get cost
      const cost = await prisma.cost.findFirst({
        where: { trainingId },
      });

      if (!cost) {
        return res.status(404).json({ error: "Cost information not found" });
      }

      res.status(200).json(cost);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update cost
LearningAndDevelopmentRouter.put(
  "/costs/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = costSchema.parse(req.body);

      // Verify the cost exists and belongs to the user
      const existingCost = await prisma.cost.findUnique({
        where: { id },
      });

      if (!existingCost) {
        return res.status(404).json({ error: "Cost information not found" });
      }

      if (existingCost.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to update this cost information" });
      }

      // Update the cost
      const updatedCost = await prisma.cost.update({
        where: { id },
        data: {
          ...validatedData,
          paymentDate: validatedData.paymentDate
            ? new Date(validatedData.paymentDate)
            : null,
        },
      });

      res.status(200).json(updatedCost);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// Create a new internal training with nested data
LearningAndDevelopmentRouter.post(
  "/internal-trainings",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        training,
        participants = [],
        trainingContent,
        evaluation,
        cost,
      } = req.body;

      // Validate main training data
      const validatedTraining = internalTrainingSchema.parse(training);

      // Validate nested data
      const validatedParticipants =
        internalParticipantsArraySchema.parse(participants);
      const validatedTrainingContent =
        internalTrainingContentSchema.parse(trainingContent);
      const validatedEvaluation = internalEvaluationSchema.parse(evaluation);
      const validatedCost = internalCostSchema.parse(cost);

      // Create the training with all related data
      const newTraining = await prisma.internalTraining.create({
        data: {
          ...validatedTraining,
          startDate: new Date(validatedTraining.startDate),
          endDate: new Date(validatedTraining.endDate),
          userId: req.user.userId,
          participants: {
            create: validatedParticipants.map((participant) => ({
              ...participant,
              userId: req.user.userId,
            })),
          },
          trainingContent: {
            create: {
              ...validatedTrainingContent,
              userId: req.user.userId,
            },
          },
          evaluation: {
            create: {
              ...validatedEvaluation,
              userId: req.user.userId,
            },
          },
          cost: {
            create: {
              ...validatedCost,
              userId: req.user.userId,
            },
          },
        },
        include: {
          participants: true,
          trainingContent: true,
          evaluation: true,
          cost: true,
        },
      });

      res.status(201).json(newTraining);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all internal trainings
LearningAndDevelopmentRouter.get(
  "/internal-trainings",
  authenticateToken,
  async (req, res) => {
    try {
      const trainings = await prisma.internalTraining.findMany({
        where: {
          userId: req.user.userId,
        },
        include: {
          participants: true,
          trainingContent: true,
          evaluation: true,
          cost: true,
        },
      });

      res.status(200).json(trainings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get a single internal training by ID
LearningAndDevelopmentRouter.get(
  "/internal-trainings/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const training = await prisma.internalTraining.findUnique({
        where: { id },
        include: {
          participants: true,
          trainingContent: true,
          evaluation: true,
          cost: true,
        },
      });

      if (!training) {
        return res.status(404).json({ error: "Training not found" });
      }

      // Check if the training belongs to the user
      if (training.userId !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to view this training" });
      }

      res.status(200).json(training);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

LearningAndDevelopmentRouter.put(
  "/internal-trainings/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { training, participants, trainingContent, evaluation, cost } =
        req.body;

      // Verify the training exists and belongs to the user
      const existingTraining = await prisma.internalTraining.findUnique({
        where: { id },
      });

      if (!existingTraining) {
        return res.status(404).json({ error: "Training not found" });
      }

      // if (existingTraining.userId !== req.user.userId) {
      //   return res
      //     .status(403)
      //     .json({ error: "Unauthorized to update this training" });
      // }

      // Validate main training data (partial updates allowed)
      const validatedTraining = training
        ? internalTrainingUpdateSchema.parse(training)
        : undefined;

      // Begin transaction to update all related records
      const updatedTraining = await prisma.$transaction(async (prisma) => {
        // Update main training record (if provided)
        if (validatedTraining) {
          await prisma.internalTraining.update({
            where: { id },
            data: {
              ...validatedTraining,
              startDate: validatedTraining.startDate
                ? new Date(validatedTraining.startDate)
                : undefined,
              endDate: validatedTraining.endDate
                ? new Date(validatedTraining.endDate)
                : undefined,
            },
          });
        }

        // Update participants if provided
        if (participants) {
          const validatedParticipants =
            internalParticipantsArraySchema.parse(participants);

          // Delete existing participants
          await prisma.internalParticipant.deleteMany({
            where: { trainingId: id },
          });

          // Create new participants
          await Promise.all(
            validatedParticipants.map((participant) =>
              prisma.internalParticipant.create({
                data: {
                  ...participant,
                  trainingId: id,
                  userId: req.user.userId,
                },
              })
            )
          );
        }

        // Update training content if provided
        if (trainingContent) {
          const validatedTrainingContent =
            internalTrainingContentUpdateSchema.parse(trainingContent);

          // Delete existing training content
          await prisma.internalTrainingContent.deleteMany({
            where: { trainingId: id },
          });

          // Create new training content
          await prisma.internalTrainingContent.create({
            data: {
              ...validatedTrainingContent,
              trainingId: id,
              userId: req.user.userId,
            },
          });
        }

        // Update evaluation if provided
        if (evaluation) {
          const validatedEvaluation =
            internalEvaluationUpdateSchema.parse(evaluation);

          // Delete existing evaluation
          await prisma.internalEvaluation.deleteMany({
            where: { trainingId: id },
          });

          // Create new evaluation
          await prisma.internalEvaluation.create({
            data: {
              ...validatedEvaluation,
              trainingId: id,
              userId: req.user.userId,
            },
          });
        }

        // Update cost if provided
        if (cost) {
          const validatedCost = internalCostUpdateSchema.parse(cost);

          // Delete existing cost
          await prisma.internalCost.deleteMany({
            where: { trainingId: id },
          });

          // Create new cost
          await prisma.internalCost.create({
            data: {
              ...validatedCost,
              trainingId: id,
              userId: req.user.userId,
            },
          });
        }

        // Fetch the updated training with all related data
        return await prisma.internalTraining.findUnique({
          where: { id },
          include: {
            participants: true,
            trainingContent: true,
            evaluation: true,
            cost: true,
          },
        });
      });

      res.status(200).json(updatedTraining);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }
);

export { LearningAndDevelopmentRouter };

// export { BusinessAdvisorySBU };
