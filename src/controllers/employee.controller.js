import asyncHandler from "../middlewares/asyncHandler.js";
import { EmployeeService } from "../services/employee.service.js";

const employeeService = new EmployeeService();

export const addEmployee = asyncHandler(async (req, res) => {
  const { message, data } = await employeeService.addEmployee(req.body);
  res.status(201).json({ message, data });
});

export const getAllEmployee = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const { message, data, totalPages } = await employeeService.getAllEmployee({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });
  res
    .status(200)
    .json({ message, data, totalPages, page: page || 1, limit: limit || 10 });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { message } = await employeeService.updateEmployee(id, req.body);
  res.status(200).json({ message });
});
export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = await employeeService.deleteEmployee(id);
  res.status(200).json({ message });
});
