import { Router } from "express";
import {
  adminMiddleware,
  authMiddleware,
  validateData,
} from "../middlewares/index.js";
import {
  addEmployee,
  getAllEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employee.controller.js";
import {
  EmployeeSchema,
  updateEmployeeSchema,
} from "../schema/employee.schema.js";
const employeeRouter = Router();

employeeRouter.post(
  "/",
  validateData(EmployeeSchema),
  authMiddleware,
  adminMiddleware,
  addEmployee
);

employeeRouter.get("/", authMiddleware, adminMiddleware, getAllEmployee);
employeeRouter.patch(
  "/:id",
  validateData(updateEmployeeSchema),
  authMiddleware,
  adminMiddleware,
  updateEmployee
);
employeeRouter.delete("/:id", authMiddleware, adminMiddleware, deleteEmployee);

export { employeeRouter };
