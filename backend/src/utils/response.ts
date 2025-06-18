import { Response } from "express";
import { ApiResponse, PaginatedResponse } from "../types";


export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    statusCode,
  });
};


export const sendError = (
  res: Response,
  message: string = "Internal Server Error",
  statusCode: number = 500,
  error?: string
): Response<ApiResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
    statusCode,
  });
};


export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = "Data retrieved successfully"
): Response<ApiResponse<PaginatedResponse<T>>> => {
  const totalPages = Math.ceil(total / limit);

  const paginatedData: PaginatedResponse<T> = {
    data,
    total,
    page,
    limit,
    totalPages,
  };

  return res.status(200).json({
    success: true,
    message,
    data: paginatedData,
    statusCode: 200,
  });
};


export const sendValidationError = (
  res: Response,
  errors: any,
  message: string = "Validation failed"
): Response<ApiResponse> => {
  return res.status(400).json({
    success: false,
    message,
    error: errors,
    statusCode: 400,
  });
};


export const sendUnauthorized = (
  res: Response,
  message: string = "Unauthorized access"
): Response<ApiResponse> => {
  return res.status(401).json({
    success: false,
    message,
    statusCode: 401,
  });
};


export const sendForbidden = (
  res: Response,
  message: string = "Access forbidden"
): Response<ApiResponse> => {
  return res.status(403).json({
    success: false,
    message,
    statusCode: 403,
  });
};


export const sendNotFound = (
  res: Response,
  message: string = "Resource not found"
): Response<ApiResponse> => {
  return res.status(404).json({
    success: false,
    message,
    statusCode: 404,
  });
};


export const sendConflict = (
  res: Response,
  message: string = "Resource already exists"
): Response<ApiResponse> => {
  return res.status(409).json({
    success: false,
    message,
    statusCode: 409,
  });
};
