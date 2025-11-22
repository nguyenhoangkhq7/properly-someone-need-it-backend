import type { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "OK"
): Response<ApiSuccessResponse<T>> => {
  return res.json({ success: true, message, data });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errorCode?: string
): Response<ApiErrorResponse> => {
  return res.status(statusCode).json({ success: false, message, errorCode });
};

