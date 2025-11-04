import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

type AxiosLikeError = Error & { response?: { status?: number; statusText?: string } };

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log error
  console.error('Error:', err);

  // Handle Axios errors
  if (err.name === 'AxiosError' && 'response' in err) {
    const axiosError = err as AxiosLikeError;
    const statusCode = axiosError.response?.status || 500;
    const message = axiosError.response?.statusText || 'External API request failed';

    res.status(statusCode).json({
      error: message,
      statusCode,
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Handle unexpected errors
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
    ...(process.env.NODE_ENV === 'development' && { message: err.message }),
  });
}
