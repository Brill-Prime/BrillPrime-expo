# Components Directory

<cite>
**Referenced Files in This Document**   
- [Map.tsx](file://components/Map.tsx)
- [Map.native.tsx](file://components/Map.native.tsx)
- [Map.web.tsx](file://components/Map.web.tsx)
- [RoleSwitcher.tsx](file://components/RoleSwitcher.tsx)
- [withRoleAccess.tsx](file://components/withRoleAccess.tsx)
- [button.tsx](file://components/ui/button.tsx)
- [card.tsx](file://components/ui/card.tsx)
- [dialog.tsx](file://components/ui/dialog.tsx)
- [AccessibilityWrapper.tsx](file://components/AccessibilityWrapper.tsx)
- [AlertProvider.tsx](file://components/AlertProvider.tsx)
- [useAuth.ts](file://hooks/useAuth.ts)
- [useSearchHistory.ts](file://hooks/useSearchHistory.ts)
- [LiveOrderTracker.tsx](file://components/LiveOrderTracker.tsx)
- [OptimizedImage.tsx](file://components/OptimizedImage.tsx)
- [Toast.tsx](file://components/Toast.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Component Architecture Overview](#component-architecture-overview)
3. [Presentational vs. Specialized Components](#presentational-vs-specialized-components)
4. [Cross-Platform Component Implementation](#cross-platform-component-implementation)
5. [Role-Based UI Components](#role-based-ui-components)
6. [React Hooks in Components](#react-hooks-in-components)
7. [Component Composition Patterns](#component-composition-patterns)
8. [Styling, Accessibility, and Responsiveness](#styling-accessibility-and-responsiveness)
9. [Best Practices for Creating New Components](#best-practices-for-creating-new-components)

## Introduction
The components directory in the Brillprime-expo application contains a comprehensive collection of reusable UI elements that form the foundation of the application's user interface. This documentation provides detailed information about the component architecture, implementation patterns, and best practices for creating and using components within the application. The components are organized to support cross-platform functionality, role-based access control, and consistent user experience across different device types and user roles.

## Component Architecture Overview
The components directory is structured to separate general-purpose UI elements from specialized components that handle specific application functionality. The architecture follows React best practices for component organization, reusability, and maintainability.

```mermaid
graph TD
A[components/] --> B[ui/]
A --> C[Map.tsx]
A --> D[RoleSwitcher.tsx]
A --> E[withRoleAccess.tsx]
A --> F[AccessibilityWrapper.tsx]
A --> G[AlertProvider.tsx]
A --> H[LiveOrderTracker.tsx]
A --> I[OptimizedImage.tsx]
A --> J[Toast.tsx]
B --> K[button.tsx]
B --> L[card.tsx]
B --> M[dialog.tsx]
B --> N[textarea.tsx]
B --> O[loading.tsx]
B --> P[tabs.tsx]
B --> Q[use-toast.tsx]
```

**Diagram sources**
- [components/ui/button.tsx](file://components/ui/button.tsx)
- [components/ui/card.tsx](file://components/ui/card.tsx)
- [components/ui/dialog.tsx](file://components/ui/dialog.tsx)

**Section sources**
- [components/Map.tsx](file://components/Map.tsx)
- [components/RoleSwitcher.tsx](file://components/RoleSwitcher.tsx)
- [components/withRoleAccess.tsx](file://components/withRoleAccess.tsx)

## Presentational vs. Specialized Components
The components directory distinguishes between presentational components in the root directory and specialized UI components in the components/ui/ subdirectory.

### Presentational Components
Presentational components in the root of the components directory are higher-level components that implement specific application functionality. These components often combine multiple UI components to create complex interfaces.

### Specialized UI Components
The components/ui/ directory contains atomic, reusable UI elements that follow a consistent design system. These components are designed to be used across the application to maintain visual consistency.

```mermaid
classDiagram
class Button {
+variant : 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost'
+size : 'sm' | 'default' | 'lg'
+disabled : boolean
+loading : boolean
+fullWidth : boolean
}
class Card {
+shadow : 'none' | 'sm' | 'base' | 'md' | 'lg'
}
class Dialog {
+open : boolean
+onOpenChange : (open : boolean) => void
}
Button --> Card : "used in"
Button --> Dialog : "used in"
Card --> Dialog : "contains"
```

**Diagram sources**
- [components/ui/button.tsx](file://components/ui/button.tsx)
- [components/ui/card.tsx](file://components/ui/card.tsx)
- [components/ui/dialog.tsx](file://components/ui/dialog.tsx)

**Section sources**
- [components/ui/button.tsx](file://components/ui/button.tsx)
- [components/ui/card.tsx](file://components/ui/card.tsx)
- [components/ui/dialog.tsx](file://components/ui/dialog.tsx)

## Cross-Platform Component Implementation
The application implements cross-platform components that conditionally render native or web variants based on the runtime environment. The Map component is a prime example of this pattern.

### Map Component Architecture
The Map component uses platform detection to render the appropriate implementation for native (iOS/Android) or web environments.

```mermaid
flowchart TD
Start([Map Component]) --> PlatformCheck{"Platform.OS === 'web'?"}
PlatformCheck --> |Yes| WebImplementation[Render Map.web.tsx]
PlatformCheck --> |No| NativeImplementation[Render Map.native.tsx]
WebImplementation --> APIKeyCheck{"Has API Key?"}
APIKeyCheck --> |No| ErrorState[Show API Key Error]
APIKeyCheck --> |Yes| LoadGoogleMaps[Load Google Maps Script]
LoadGoogleMaps --> InitMap[Initialize Map]
InitMap --> HandleEvents[Set Up Event Listeners]
HandleEvents --> Complete[Map Ready]
NativeImplementation --> UseReactNativeMaps[Use react-native-maps]
UseReactNativeMaps --> Complete
```

**Diagram sources**
- [components/Map.tsx](file://components/Map.tsx)
- [components/Map.native.tsx](file://components/Map.native.tsx)
- [components/Map.web.tsx](file://components/Map.web.tsx)

**Section sources**
- [components/Map.tsx](file://components/Map.tsx)
- [components/Map.native.tsx](file://components/Map.native.tsx)
- [components/Map.web.tsx](file://components/Map.web.tsx)

## Role-Based UI Components
The application implements role-based UI rendering through specialized components that control access and display based on user roles.

### RoleSwitcher Component
The RoleSwitcher component provides a modal interface for users to switch between different roles (consumer, merchant, driver) within the application.

```mermaid
sequenceDiagram
participant User
participant RoleSwitcher
participant RoleService
participant Router
User->>RoleSwitcher : Open modal
RoleSwitcher->>RoleService : Get available roles
RoleService-->>RoleSwitcher : Return roles and current role
RoleSwitcher->>User : Display role options
User->>RoleSwitcher : Select role
RoleSwitcher->>RoleService : Request role switch
RoleService-->>RoleSwitcher : Return switch result
alt Success
RoleSwitcher->>Router : Navigate to role-specific route
RoleSwitcher->>User : Close modal
else Requires Registration
RoleSwitcher->>User : Show registration prompt
User->>RoleSwitcher : Confirm registration
RoleSwitcher->>Router : Navigate to registration
end
```

**Diagram sources**
- [components/RoleSwitcher.tsx](file://components/RoleSwitcher.tsx)
- [services/roleManagementService.ts](file://services/roleManagementService.ts)
- [app.config.js](file://app.config.js)

**Section sources**
- [components/RoleSwitcher.tsx](file://components/RoleSwitcher.tsx)

### withRoleAccess Higher-Order Component
The withRoleAccess component is a higher-order component that wraps other components to enforce role-based access control.

```mermaid
flowchart TD
A[withRoleAccess] --> B{Check Role Access}
B --> C[Loading State]
C --> D[Call roleManagementService.checkRoleAccess]
D --> E{Has Access?}
E --> |Yes| F[Render Wrapped Component]
E --> |No| G{Show Unauthorized Message?}
G --> |Yes| H[Display Access Denied UI]
G --> |No| I[Render null]
H --> J[Show Registration Option]
H --> K[Show Verification Status]
```

**Diagram sources**
- [components/withRoleAccess.tsx](file://components/withRoleAccess.tsx)
- [services/roleManagementService.ts](file://services/roleManagementService.ts)

**Section sources**
- [components/withRoleAccess.tsx](file://components/withRoleAccess.tsx)

## React Hooks in Components
The application leverages React hooks within components for state management and side effects, following modern React patterns.

### Custom Hooks Usage
Components use both built-in React hooks and custom application hooks to manage state and side effects.

```mermaid
classDiagram
class UseAuth {
+isAuthenticated : boolean
+isLoading : boolean
+user : any
+token : string | null
+role : string | null
+checkAuth() : void
+requireRole(role : string) : boolean
+signOut() : void
}
class UseSearchHistory {
+searchHistory : string[]
+addToHistory(term : string) : void
+clearHistory() : void
+removeFromHistory(term : string) : void
}
class UseEffect {
+useEffect(callback : () => void, deps : any[]) : void
}
class UseState {
+useState(initial : T) : [T, (value : T) => void]
}
UseAuth --> UseEffect : "uses"
UseAuth --> UseState : "uses"
UseSearchHistory --> UseEffect : "uses"
UseSearchHistory --> UseState : "uses"
LiveOrderTracker --> UseEffect : "uses"
LiveOrderTracker --> UseState : "uses"
LiveOrderTracker --> UseAuth : "uses"
```

**Diagram sources**
- [hooks/useAuth.ts](file://hooks/useAuth.ts)
- [hooks/useSearchHistory.ts](file://hooks/useSearchHistory.ts)
- [components/LiveOrderTracker.tsx](file://components/LiveOrderTracker.tsx)

**Section sources**
- [hooks/useAuth.ts](file://hooks/useAuth.ts)
- [hooks/useSearchHistory.ts](file://hooks/useSearchHistory.ts)

## Component Composition Patterns
The application employs various component composition patterns to create complex UIs from simpler, reusable components.

### Container-Component Pattern
Many screens use a container-component pattern where a container manages state and data fetching, while presentational components handle rendering.

```mermaid
flowchart TD
A[Container Component] --> B[Fetch Data]
B --> C[Manage State]
C --> D[Handle Events]
D --> E[Presentation Component 1]
D --> F[Presentation Component 2]
D --> G[Presentation Component 3]
E --> H[Display Data]
F --> H
G --> H
H --> I[User Interaction]
I --> A
```

**Diagram sources**
- [components/LiveOrderTracker.tsx](file://components/LiveOrderTracker.tsx)
- [components/RoleSwitcher.tsx](file://components/RoleSwitcher.tsx)

**Section sources**
- [components/LiveOrderTracker.tsx](file://components/LiveOrderTracker.tsx)

### Provider Pattern
The application uses the React context provider pattern for global state management and service access.

```mermaid
flowchart TD
A[AlertProvider] --> B[Create Context]
B --> C[Manage Alert State]
C --> D[Provide Alert Functions]
D --> E[Child Components]
E --> F[useAlert Hook]
F --> G[Show Alert]
G --> A
A --> H[Display AlertModal]
```

**Diagram sources**
- [components/AlertProvider.tsx](file://components/AlertProvider.tsx)
- [components/AlertModal.tsx](file://components/AlertModal.tsx)

**Section sources**
- [components/AlertProvider.tsx](file://components/AlertProvider.tsx)

## Styling, Accessibility, and Responsiveness
The components follow consistent patterns for styling, accessibility, and responsiveness to ensure a high-quality user experience across devices.

### Styling System
The application uses a theme-based styling system that centralizes design tokens and ensures consistency.

```mermaid
classDiagram
class Theme {
+colors : object
+spacing : object
+borderRadius : object
+typography : object
+shadows : object
}
class Button {
+styles : StyleSheet
+theme : Theme
}
class Card {
+styles : StyleSheet
+theme : Theme
}
class AccessibilityWrapper {
+accessible : boolean
+accessibilityLabel : string
+accessibilityHint : string
+accessibilityRole : string
}
Theme --> Button : "used by"
Theme --> Card : "used by"
AccessibilityWrapper --> View : "wraps"
```

**Diagram sources**
- [config/theme.ts](file://config/theme.ts)
- [components/ui/button.tsx](file://components/ui/button.tsx)
- [components/ui/card.tsx](file://components/ui/card.tsx)
- [components/AccessibilityWrapper.tsx](file://components/AccessibilityWrapper.tsx)

**Section sources**
- [config/theme.ts](file://config/theme.ts)
- [components/AccessibilityWrapper.tsx](file://components/AccessibilityWrapper.tsx)

### Responsive Design
Components implement responsive design patterns to adapt to different screen sizes and orientations.

```mermaid
flowchart TD
A[Component] --> B[Get Screen Dimensions]
B --> C{Screen Width < 768px?}
C --> |Yes| D[Apply Mobile Styles]
C --> |No| E[Apply Desktop Styles]
D --> F[Adjust Layout]
D --> G[Modify Typography]
D --> H[Optimize Touch Targets]
E --> I[Adjust Layout]
E --> J[Modify Typography]
E --> K[Optimize for Mouse]
```

**Diagram sources**
- [components/ui/card.tsx](file://components/ui/card.tsx)
- [components/OptimizedImage.tsx](file://components/OptimizedImage.tsx)

**Section sources**
- [components/ui/card.tsx](file://components/ui/card.tsx)

## Best Practices for Creating New Components
When creating new components, follow these established patterns and conventions to maintain consistency with the existing codebase.

### Component Structure
New components should follow the established structure and organization patterns.

```mermaid
flowchart TD
A[New Component] --> B[Import Dependencies]
B --> C[Define Props Interface]
C --> D[Create Component Function]
D --> E[Use Hooks for State]
E --> F[Implement Logic]
F --> G[Return JSX]
G --> H[Apply Styles]
H --> I[Export Component]
```

**Section sources**
- [components/ui/button.tsx](file://components/ui/button.tsx)
- [components/Toast.tsx](file://components/Toast.tsx)

### Styling Guidelines
Follow the established styling conventions when creating new components.

```mermaid
flowchart TD
A[Use Theme Variables] --> B[Access theme.colors]
A --> C[Access theme.spacing]
A --> D[Access theme.typography]
A --> E[Access theme.borderRadius]
B --> F[Ensure Consistent Colors]
C --> G[Ensure Consistent Spacing]
D --> H[Ensure Consistent Typography]
E --> I[Ensure Consistent Corner Radius]
```

**Section sources**
- [config/theme.ts](file://config/theme.ts)
- [components/ui/button.tsx](file://components/ui/button.tsx)

### Accessibility Implementation
Ensure all new components are accessible to users with disabilities.

```mermaid
flowchart TD
A[New Component] --> B[Use AccessibilityWrapper]
B --> C[Set accessibilityLabel]
C --> D[Set accessibilityHint]
D --> E[Set accessibilityRole]
E --> F[Test with Screen Reader]
```

**Section sources**
- [components/AccessibilityWrapper.tsx](file://components/AccessibilityWrapper.tsx)

### Performance Optimization
Implement performance optimizations in new components.

```mermaid
flowchart TD
A[New Component] --> B[Use React.memo if Pure]
B --> C[Optimize Re-renders]
C --> D[Use useCallback for Callbacks]
D --> E[Use useMemo for Expensive Calculations]
E --> F[Implement Loading States]
F --> G[Handle Error States]
```

**Section sources**
- [components/OptimizedImage.tsx](file://components/OptimizedImage.tsx)
- [components/Toast.tsx](file://components/Toast.tsx)