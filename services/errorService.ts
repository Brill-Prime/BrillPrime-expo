
// Error Service
// Centralized error handling and logging

interface ErrorLog {
  timestamp: string;
  error: string;
  stack?: string;
  context?: string;
  userId?: string;
}

class ErrorService {
  private errorLogs: ErrorLog[] = [];
  
  // Log error with context
  logError(error: Error | string, context?: string): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };

    this.errorLogs.push(errorLog);
    console.error('Error logged:', errorLog);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(errorLog);
    }
  }

  // Send error to tracking service (like Sentry, Bugsnag, etc.)
  private async sendToErrorTracking(errorLog: ErrorLog): Promise<void> {
    try {
      // Replace with your error tracking service API
      // await fetch('https://your-error-tracking-service.com/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog)
      // });
    } catch (e) {
      console.error('Failed to send error to tracking service:', e);
    }
  }

  // Get recent error logs
  getRecentErrors(limit: number = 10): ErrorLog[] {
    return this.errorLogs.slice(-limit);
  }

  // Clear error logs
  clearLogs(): void {
    this.errorLogs = [];
  }

  // Handle API errors specifically
  handleApiError(error: any, context: string): string {
    let message = 'An unexpected error occurred';

    if (error?.response) {
      // HTTP error
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          message = data?.message || 'Bad request';
          break;
        case 401:
          message = 'Authentication failed';
          break;
        case 403:
          message = 'Access denied';
          break;
        case 404:
          message = 'Resource not found';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = data?.message || `HTTP ${status} error`;
      }
    } else if (error?.code === 'NETWORK_ERROR') {
      message = 'Network connection failed. Please check your internet.';
    } else if (error?.message) {
      message = error.message;
    }

    this.logError(error, context);
    return message;
  }
}

export const errorService = new ErrorService();
// Error Service
// Centralized error handling and logging

export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  timestamp: string;
}

export interface ErrorReport {
  id: string;
  errors: AppError[];
  deviceInfo: any;
  userAgent: string;
  timestamp: string;
}

class ErrorService {
  private errors: AppError[] = [];

  logError(error: Error, context?: any, severity: AppError['severity'] = 'medium'): void {
    const appError: AppError = {
      code: error.name || 'UnknownError',
      message: error.message,
      severity,
      context,
      timestamp: new Date().toISOString(),
    };

    this.errors.push(appError);
    console.error('App Error:', appError);

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(appError);
    }
  }

  private async reportError(error: AppError): Promise<void> {
    try {
      // Report to error tracking service
      // Implementation would depend on chosen service (Sentry, Bugsnag, etc.)
      console.log('Reporting error:', error);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  getRecentErrors(limit: number = 50): AppError[] {
    return this.errors.slice(-limit);
  }

  clearErrors(): void {
    this.errors = [];
  }

  handleApiError(error: any): string {
    if (error.response) {
      // Server responded with error status
      return error.response.data?.message || 'Server error occurred';
    } else if (error.request) {
      // Network error
      return 'Network error. Please check your connection';
    } else {
      // Something else happened
      return error.message || 'An unexpected error occurred';
    }
  }

  isNetworkError(error: any): boolean {
    return !error.response && error.request;
  }

  isServerError(error: any): boolean {
    return error.response && error.response.status >= 500;
  }

  isClientError(error: any): boolean {
    return error.response && error.response.status >= 400 && error.response.status < 500;
  }
}

export const errorService = new ErrorService();
