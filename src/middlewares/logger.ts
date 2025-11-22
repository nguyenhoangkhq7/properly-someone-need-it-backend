import type { Request, Response, NextFunction } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);

  // Log when the response finishes so we can include status and duration
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[RESPONSE] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

