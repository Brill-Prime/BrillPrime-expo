
// Migration Service
// Helps manage gradual migration from mock data to real API calls

class MigrationService {
  // Feature flags to control which services use real API
  private featureFlags = {
    useRealAuth: true,          // Auth is critical, should use real API ✓
    useRealMerchants: true,     // Using real backend API ✓
    useRealCommodities: true,   // Using real backend API ✓
    useRealOrders: true,        // Using real backend API ✓
    useRealPayments: true,      // Using real backend API ✓
    useRealKYC: true,           // KYC should use real validation ✓
    useRealAdmin: true,         // Admin features should use real API ✓
    useRealNotifications: true, // Using real backend API ✓
    useRealChat: true,          // Using real backend API ✓
  };

  // Check if a feature should use real API
  shouldUseRealAPI(feature: keyof typeof this.featureFlags): boolean {
    return this.featureFlags[feature] ?? false;
  }

  // Enable real API for a feature
  enableRealAPI(feature: keyof typeof this.featureFlags): void {
    this.featureFlags[feature] = true;
    console.log(`Enabled real API for: ${feature}`);
  }

  // Disable real API for a feature (fallback to mock)
  disableRealAPI(feature: keyof typeof this.featureFlags): void {
    this.featureFlags[feature] = false;
    console.log(`Disabled real API for: ${feature}`);
  }

  // Get all feature flags status
  getFeatureFlags() {
    return { ...this.featureFlags };
  }

  // Batch enable features
  enableFeatures(features: Array<keyof typeof this.featureFlags>): void {
    features.forEach(feature => this.enableRealAPI(feature));
  }
}

export const migrationService = new MigrationService();
