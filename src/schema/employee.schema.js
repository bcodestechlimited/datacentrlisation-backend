import { z } from "zod";

export const EmployeeSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  department: z.string(),
  role: z.enum(["employee", "admin"]).optional(),
  salary: z.number().positive("Salary must be a positive number"),
  joiningDate: z.string(),
});

export const updateEmployeeSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(["employee", "admin"]).optional(),
  salary: z.number().positive("Salary must be a positive number").optional(),
  joiningDate: z.string().optional(),
});
