/**
 * Global Error Handler
 * Standardized error handling across the app
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public recoverable: boolean = true,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Handle and transform errors into user-friendly messages
 */
export const handleError = (error: unknown): AppError => {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Network errors
  if (error instanceof TypeError) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new AppError(
        error.message,
        'NETWORK_ERROR',
        'Network connection failed. Please check your internet and try again.',
        true,
        error
      );
    }
  }

  // Supabase/PostgreSQL errors
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as any;
    
    // Database errors
    if (pgError.code?.startsWith('PGRST')) {
      return new AppError(
        pgError.message || 'Database error',
        pgError.code,
        'A database error occurred. Please try again.',
        true,
        error
      );
    }

    // Unique constraint violation
    if (pgError.code === '23505') {
      return new AppError(
        pgError.message || 'Duplicate entry',
        '23505',
        'This information is already in use. Please try a different value.',
        true,
        error
      );
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      return new AppError(
        pgError.message || 'Referenced record not found',
        '23503',
        'Related data not found. Please try again.',
        true,
        error
      );
    }

    // Check constraint violation
    if (pgError.code === '23514') {
      return new AppError(
        pgError.message || 'Invalid data',
        '23514',
        'Invalid data provided. Please check your inputs.',
        true,
        error
      );
    }

    // Insufficient privilege
    if (pgError.code === '42501') {
      return new AppError(
        pgError.message || 'Permission denied',
        '42501',
        'You do not have permission to perform this action.',
        false,
        error
      );
    }
  }

  // Timeout errors
  if (error && typeof error === 'object' && 'message' in error) {
    const errMsg = (error as Error).message.toLowerCase();
    if (errMsg.includes('timeout') || errMsg.includes('timed out')) {
      return new AppError(
        (error as Error).message,
        'TIMEOUT_ERROR',
        'Request timed out. Please try again.',
        true,
        error
      );
    }

    // RLS errors
    if (errMsg.includes('row level security') || errMsg.includes('rls')) {
      return new AppError(
        (error as Error).message,
        'RLS_ERROR',
        'Access denied. Please log in again.',
        true,
        error
      );
    }
  }

  // Auth errors
  if (error && typeof error === 'object' && 'status' in error) {
    const statusError = error as { status: number; message?: string };
    
    if (statusError.status === 401) {
      return new AppError(
        statusError.message || 'Unauthorized',
        'AUTH_ERROR',
        'Your session has expired. Please log in again.',
        true,
        error
      );
    }

    if (statusError.status === 403) {
      return new AppError(
        statusError.message || 'Forbidden',
        'FORBIDDEN_ERROR',
        'You do not have permission to access this resource.',
        false,
        error
      );
    }

    if (statusError.status === 404) {
      return new AppError(
        statusError.message || 'Not found',
        'NOT_FOUND_ERROR',
        'The requested resource was not found.',
        true,
        error
      );
    }

    if (statusError.status >= 500) {
      return new AppError(
        statusError.message || 'Server error',
        'SERVER_ERROR',
        'Server error occurred. Please try again later.',
        true,
        error
      );
    }
  }

  // Default unknown error
  const defaultMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  return new AppError(
    defaultMessage,
    'UNKNOWN_ERROR',
    'Something went wrong. Please try again.',
    true,
    error
  );
};

/**
 * Log error to console (in production, send to error tracking service like Sentry)
 */
export const logError = (error: AppError | Error, context?: string) => {
  console.error('❌ Error occurred:', {
    context,
    message: error.message,
    code: error instanceof AppError ? error.code : 'UNKNOWN',
    recoverable: error instanceof AppError ? error.recoverable : undefined,
    stack: error.stack,
  });

  // TODO: Send to Sentry or other error tracking service
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { tags: { context } });
  // }
};

/**
 * Handle error with user notification
 * Use in try-catch blocks throughout the app
 */
export const handleErrorWithNotification = (
  error: unknown,
  context: string
): AppError => {
  const appError = handleError(error);
  logError(appError, context);
  return appError;
};


