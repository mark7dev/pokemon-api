import { AppError } from '../middleware/errorHandler';

export function toAppError(error: unknown, fallbackMessage: string, statusCode = 503): AppError {
  if (isAxiosError(error)) {
    const axiosErr = error as { message?: string; response?: { status?: number } };
    const message = axiosErr.message || fallbackMessage;
    return new AppError(message, axiosErr.response?.status || statusCode);
  }
  if (error instanceof Error) {
    return new AppError(error.message, statusCode);
  }
  return new AppError(fallbackMessage, statusCode);
}

export function isAxiosError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as Record<string, unknown>;
  return maybe.isAxiosError === true;
}
