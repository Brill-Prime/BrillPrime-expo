import { ExpoRoot } from 'expo-router';
import { FeatureManager } from './services/featureManager';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize all BrillPrime features
    FeatureManager.initialize();
  }, []);

  return ExpoRoot({});
}

export default App;
