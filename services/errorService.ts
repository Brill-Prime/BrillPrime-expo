
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
