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
    
    // Only log unique errors to reduce console spam
    const isDuplicate = this.errors.slice(-5).some(e => 
      e.code === appError.code && 
      e.message === appError.message &&
      e.context?.endpoint === appError.context?.endpoint
    );
    
    if (!isDuplicate) {
      console.error('App Error:', appError);
    }

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