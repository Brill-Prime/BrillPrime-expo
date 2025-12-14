# BrillPrime Expo - File Structure

## Overview

This document describes the standardized file structure for the BrillPrime Expo application.

## Root Directory Structure

```
Brillprime-expo/
├── .devcontainer/          # Dev container configuration
├── .github/                # GitHub workflows and actions
├── android/                # Android native code
├── ios/                    # iOS native code
├── app/                    # Expo Router app directory (screens)
├── assets/                 # Static assets (images, fonts, etc.)
├── components/             # Reusable React components
├── config/                 # Configuration files
├── contexts/               # React Context providers
├── dataconnect/            # Firebase Data Connect
├── docs/                   # Documentation
├── hooks/                  # Custom React hooks
├── scripts/                # Build and deployment scripts
├── services/               # API and business logic services
├── src/                    # Generated code (dataconnect)
├── supabase/               # Supabase configuration and functions
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
└── [config files]          # Root configuration files
```

## Detailed Structure

### `/app` - Application Screens (Expo Router)

```
app/
├── _components/            # Screen-specific components
├── _layout.tsx             # Root layout
├── index.tsx               # Splash/entry screen
├── about/                  # About screens
├── account/                # Account management
├── admin/                  # Admin panel screens
├── api/                    # API routes (if using)
├── auth/                   # Authentication screens
│   ├── _layout.tsx
│   ├── signin.tsx
│   ├── signup.tsx
│   ├── role-selection.tsx
│   └── otp-verification.tsx
├── cart/                   # Shopping cart
├── chat/                   # Messaging/chat
├── checkout/               # Checkout flow
├── commodity/              # Product/commodity screens
├── dashboard/              # Dashboard screens
├── driver/                 # Driver-specific screens
├── favorites/              # Favorites/wishlist
├── home/                   # Home screens by role
│   ├── consumer.tsx
│   ├── driver.tsx
│   └── merchant.tsx
├── kyc/                    # KYC verification
├── merchant/               # Merchant-specific screens
├── messages/               # Messages
├── notifications/          # Notifications
├── onboarding/             # Onboarding flow
├── order/                  # Order details
├── orders/                 # Order list
├── payment/                # Payment screens
├── profile/                # User profile
├── search/                 # Search functionality
├── settings/               # Settings
├── store-locator/          # Store locator
├── support/                # Support/help
├── toll/                   # Toll-related features
└── transactions/           # Transaction history
```

### `/components` - Reusable Components

```
components/
├── __tests__/              # Component tests
├── ui/                     # UI primitives
├── AlertProvider.tsx       # Alert/notification system
├── ErrorBoundary.tsx       # Error handling
├── LoadingIndicator.tsx    # Loading states
├── Map.tsx                 # Map component (platform router)
├── Map.web.tsx             # Web map implementation
├── Map.native.tsx          # Native map implementation
├── MapMarkers.tsx          # Map marker components
├── OfflineBanner.tsx       # Offline indicator
├── PullToRefresh.tsx       # Pull-to-refresh
└── [other components]
```

### `/services` - Business Logic

```
services/
├── api.ts                  # API client
├── apiEndpoints.ts         # API endpoint definitions
├── authService.ts          # Authentication
├── cartService.ts          # Shopping cart
├── commodityService.ts     # Products/commodities
├── locationService.ts      # Geolocation
├── merchantService.ts      # Merchant operations
├── notificationService.ts  # Notifications
├── orderService.ts         # Order management
├── paymentService.ts       # Payment processing
├── userService.ts          # User management
└── types.ts                # Service type definitions
```

### `/contexts` - State Management

```
contexts/
├── AppContext.tsx          # Global app state
├── AuthContext.tsx         # Authentication state
├── MerchantContext.tsx     # Merchant-specific state
├── NotificationContext.tsx # Notification state
└── ThemeContext.tsx        # Theme/styling state
```

### `/hooks` - Custom Hooks

```
hooks/
├── useAuth.ts              # Authentication hook
├── useDeepLinking.ts       # Deep linking
├── useKeyboard.ts          # Keyboard handling
├── useOfflineMode.ts       # Offline detection
├── usePagination.ts        # Pagination
├── usePerformance.ts       # Performance monitoring
├── useSearchHistory.ts     # Search history
└── useSessionTimeout.ts    # Session management
```

### `/utils` - Utility Functions

```
utils/
├── addressValidation.ts    # Address validation
├── commodityUtils.ts       # Commodity helpers
├── currency.ts             # Currency formatting
├── fileValidation.ts       # File validation
├── googleMaps.ts           # Google Maps utilities
├── mapOptimization.ts      # Map performance
├── performance.ts          # Performance utilities
├── platformStyles.ts       # Platform-specific styles
└── validation.ts           # General validation
```

### `/config` - Configuration

```
config/
├── environment.ts          # Environment variables
├── firebase.ts             # Firebase configuration
└── supabase.ts             # Supabase configuration
```

### `/types` - TypeScript Types

```
types/
├── index.ts                # Exported types
├── api.ts                  # API types
├── models.ts               # Data models
└── navigation.ts           # Navigation types
```

### `/docs` - Documentation

```
docs/
├── architecture/           # Architecture documentation
│   ├── ARCHITECTURE.md
│   └── SUPABASE_ARCHITECTURE.md
├── bug-fixes/              # Bug fix documentation
│   ├── BUG_FIX_SUMMARY.md
│   ├── BLANK_SCREEN_FIX.md
│   ├── ISSUES_FOUND.md
│   └── TYPESCRIPT_FIXES.md
├── guides/                 # Setup and usage guides
│   ├── BACKEND_IMPLEMENTATION_GUIDE.md
│   ├── GOOGLE_MAPS_SETUP.md
│   └── SUPABASE_COMMODITY_SETUP.md
├── migrations/             # Migration documentation
│   ├── MAP_MIGRATION_SUMMARY.md
│   ├── REPLIT_REMOVAL.md
│   ├── SERVERLESS_MIGRATION_COMPLETE.md
│   ├── SUPABASE_DEPLOYMENT.md
│   └── SUPABASE_MIGRATION_GUIDE.md
├── CROSS_PLATFORM_VERIFICATION.md
├── FILE_STRUCTURE.md       # This file
├── HANDOFF.md
├── IMPLEMENTATION_SUMMARY.md
├── MAP_IMPROVEMENTS_SUMMARY.md
├── PROGRESS_UPDATE.md
├── README.md
├── ROUTING_VERIFICATION.md
├── WORK_SUMMARY.md
└── test-app-flow.md
```

### `/supabase` - Supabase Backend

```
supabase/
├── functions/              # Edge functions
│   ├── cart-add/
│   ├── cart-get/
│   ├── create-order/
│   ├── merchants-list/
│   ├── merchants-nearby/
│   └── [other functions]
├── migrations/             # Database migrations
└── DEPLOYMENT_INSTRUCTIONS.md
```

### `/scripts` - Automation Scripts

```
scripts/
├── check-deployed-functions.sh
├── deploy-all-functions.sh
├── deploy-edge-functions.sh
├── fix-supabase-constraints.sh
├── reset-project.js
├── seed-database.sh
├── seed-via-api.ts
├── setup-chat-attachments.sh
├── setup-database.sh
├── setup-geolocation-features.sh
├── test-cart-checkout.sh
├── test-frontend-connection.sh
├── test-supabase-functions.sh
└── verify-database.sh
```

## File Naming Conventions

### Components
- **PascalCase** for component files: `AlertProvider.tsx`, `MapMarkers.tsx`
- **camelCase** for utility components: `withRoleAccess.tsx`
- Test files: `ComponentName.test.tsx`

### Screens (App Directory)
- **kebab-case** for route segments: `role-selection.tsx`, `otp-verification.tsx`
- **camelCase** for single-word screens: `signin.tsx`, `signup.tsx`
- Layout files: `_layout.tsx`
- Index files: `index.tsx`

### Services
- **camelCase** with Service suffix: `authService.ts`, `cartService.ts`
- Types file: `types.ts`

### Utilities
- **camelCase**: `validation.ts`, `currency.ts`

### Documentation
- **SCREAMING_SNAKE_CASE** for major docs: `README.md`, `TODO.md`
- **PascalCase** for specific docs: `FileStructure.md`

## Import Conventions

### Absolute Imports
Use `@/` prefix for absolute imports:
```typescript
import { UserMarker } from '@/components/MapMarkers';
import { authService } from '@/services/authService';
```

### Relative Imports
Use relative imports for nearby files:
```typescript
import { AlertProvider } from '../../components/AlertProvider';
import { theme } from './styles';
```

## Code Organization Best Practices

### 1. Component Structure
```typescript
// Imports
import React from 'react';
import { View, Text } from 'react-native';

// Types
interface Props {
  // ...
}

// Component
export const ComponentName: React.FC<Props> = ({ ...props }) => {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
};

// Styles
const styles = StyleSheet.create({
  // ...
});
```

### 2. Service Structure
```typescript
// Imports
import { apiClient } from './api';

// Types
interface ServiceResponse {
  // ...
}

// Service Class
class ServiceName {
  // Private methods
  private async helperMethod() {}
  
  // Public methods
  async publicMethod() {}
}

// Export singleton
export const serviceName = new ServiceName();
```

### 3. Hook Structure
```typescript
// Imports
import { useState, useEffect } from 'react';

// Hook
export const useCustomHook = () => {
  // State
  // Effects
  // Handlers
  // Return
  return {
    // ...
  };
};
```

## Platform-Specific Files

### Naming Convention
- Web: `Component.web.tsx`
- Native (iOS/Android): `Component.native.tsx`
- iOS only: `Component.ios.tsx`
- Android only: `Component.android.tsx`

### Example
```
Map.tsx           # Platform router
Map.web.tsx       # Web implementation
Map.native.tsx    # iOS/Android implementation
```

## Configuration Files

### Root Level
```
.env                    # Environment variables (gitignored)
.env.example            # Environment template
.gitignore              # Git ignore rules
app.config.js           # Expo configuration
eas.json                # EAS Build configuration
eslint.config.js        # ESLint configuration
firebase.json           # Firebase configuration
metro.config.js         # Metro bundler configuration
package.json            # Dependencies
tsconfig.json           # TypeScript configuration
```

## Assets Organization

```
assets/
├── fonts/              # Custom fonts
│   ├── Montserrat-Bold.ttf
│   ├── Montserrat-Regular.ttf
│   └── [other fonts]
├── images/             # Images
│   ├── generated-icon.png
│   └── [other images]
└── attached_assets/    # User-uploaded assets
```

## Testing Structure

```
__tests__/
├── components/         # Component tests
├── services/           # Service tests
├── hooks/              # Hook tests
└── utils/              # Utility tests
```

## Ignored Directories

The following directories are gitignored:
- `node_modules/` - Dependencies
- `.expo/` - Expo cache
- `dist/` - Build output
- `web-build/` - Web build output
- `.idea/` - IntelliJ IDEA
- `.qoder/` - Qoder AI
- `.windsurf/` - Windsurf IDE
- `.vscode/` - VS Code settings
- `.cache/` - Cache files

## Migration Notes

### Recent Changes
1. Moved all root-level documentation to `/docs` with categorization
2. Organized docs into subdirectories: `architecture/`, `bug-fixes/`, `guides/`, `migrations/`
3. Added `.gitignore` entries for IDE folders
4. Standardized component naming conventions
5. Created reusable marker components in `/components/MapMarkers.tsx`

### Future Improvements
1. Consider moving `app/_components/` to `components/screens/`
2. Add more comprehensive test coverage
3. Create component library documentation
4. Add Storybook for component development
5. Implement automated dependency auditing

## Maintenance

### Regular Cleanup Tasks
1. Remove unused dependencies: `npm prune`
2. Update dependencies: `npm update`
3. Check for security issues: `npm audit`
4. Clean build artifacts: `rm -rf .expo dist web-build`
5. Verify file structure: Review this document

### Code Quality
1. Run linter: `npm run lint`
2. Run type checker: `npm run typecheck`
3. Run tests: `npm test`
4. Format code: Use Prettier/ESLint auto-fix

## References

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Supabase Documentation](https://supabase.com/docs)
