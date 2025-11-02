import { ExpoRoot } from 'expo-router';
import { FeatureManager } from './services/featureManager';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { errorService } from './services/errorService';

function App() {
  useEffect(() => {
    // Initialize all BrillPrime features
    FeatureManager.initialize();

    // Global error handlers
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorService.logError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        { reason: event.reason },
        'high'
      );
    };

    const handleError = (event: ErrorEvent) => {
      errorService.logError(event.error, { message: event.message }, 'high');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleError);

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      {ExpoRoot({})}
    </ErrorBoundary>
  );
}

export default App;
