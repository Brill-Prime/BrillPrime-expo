# Geolocation Services

<cite>
**Referenced Files in This Document**   
- [locationService.ts](file://services/locationService.ts)
- [consumer.tsx](file://app/dashboard/consumer.tsx)
- [MapErrorBoundary.tsx](file://app/_components/MapErrorBoundary.tsx)
- [MapContainer.tsx](file://app/_components/MapContainer.tsx)
- [Map.tsx](file://components/Map.tsx)
- [Map.web.tsx](file://components/Map.web.tsx)
- [types.ts](file://services/types.ts)
- [environment.ts](file://config/environment.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Location Service Architecture](#location-service-architecture)
3. [Platform-Specific Geolocation Implementation](#platform-specific-geolocation-implementation)
4. [getCurrentLocation Method Analysis](#getcurrentlocation-method-analysis)
5. [Reverse Geocoding with OpenStreetMap](#reverse-geocoding-with-openstreetmap)
6. [Integration with Consumer Dashboard](#integration-with-consumer-dashboard)
7. [Error Handling and Recovery](#error-handling-and-recovery)
8. [Best Practices and Optimization](#best-practices-and-optimization)

## Introduction
The geolocation services in Brillprime-expo provide a comprehensive solution for location-based functionality across web, iOS, and Android platforms. The implementation centers around the `locationService.ts` module, which handles platform-specific geolocation through `navigator.geolocation` for web and Expo Location for native platforms. This document details the architecture, implementation, and integration of these services, focusing on automatic location detection, permission handling, error recovery, and reverse geocoding capabilities.

The system is designed to provide high-accuracy location data while implementing robust fallback mechanisms and error handling strategies. It integrates seamlessly with the consumer dashboard and other components through well-defined interfaces and error boundaries, ensuring a reliable user experience across different device types and network conditions.

## Location Service Architecture

```mermaid
classDiagram
class LocationService {
+requestLocationPermission() Promise~boolean~
+getCurrentLocation() Promise~Location | null~
+reverseGeocode(latitude, longitude) Promise~string | null~
+getNearbyMerchants(latitude, longitude, radius, type) Promise~ApiResponse~Merchant[]~~
+calculateDistance(lat1, lon1, lat2, lon2) number
+startLiveTracking(updateInterval) Promise~void~
+stopLiveTracking() void
+getLiveLocation(userId) Promise~ApiResponse~LocationData~~
-getWebLocation() Promise~Location | null~
-getNativeLocation() Promise~Location | null~
-detectMovement(newLocation) {isMoving, heading, speed}
-broadcastLocationToSupabase(location) Promise~void~
}
class Location {
+latitude : number
+longitude : number
+accuracy? : number | null
+timestamp : number
+isStale? : boolean
}
class LocationData {
+latitude : number
+longitude : number
+address? : string
+timestamp : number
+accuracy? : number
+heading? : number
+speed? : number
+isMoving? : boolean
}
class MapErrorBoundary {
+hasError : boolean
+error? : Error
+getDerivedStateFromError(error) State
+componentDidCatch(error, errorInfo) void
+handleRetry() void
}
LocationService --> Location : "uses"
LocationService --> LocationData : "manages"
MapErrorBoundary --> LocationService : "protects"
```

**Diagram sources**
- [locationService.ts](file://services/locationService.ts#L31-L773)
- [types.ts](file://services/types.ts#L155-L159)
- [MapErrorBoundary.tsx](file://app/_components/MapErrorBoundary.tsx#L1-L109)

**Section sources**
- [locationService.ts](file://services/locationService.ts#L1-L773)
- [types.ts](file://services/types.ts#L1-L228)

## Platform-Specific Geolocation Implementation

```mermaid
flowchart TD
Start([Get Current Location]) --> CheckPlatform{"Platform OS?"}
CheckPlatform --> |Web| CheckGeolocation["Check navigator.geolocation availability"]
CheckPlatform --> |Native| RequestPermission["Request Foreground Permissions"]
CheckGeolocation --> |Available| CheckPermission["Check Permissions API state"]
CheckGeolocation --> |Not Available| ReturnNull["Return null"]
CheckPermission --> |Denied| ReturnNull
CheckPermission --> |Granted| GetWebLocation["Call getWebLocation()"]
CheckPermission --> |Unknown| GetWebLocation
RequestPermission --> |Granted| GetNativeLocation["Call getNativeLocation()"]
RequestPermission --> |Denied| ReturnNull
GetWebLocation --> CreateTimeout["Create 15s timeout for primary request"]
CreateTimeout --> PrimaryRequest["Call getCurrentPosition with high accuracy"]
PrimaryRequest --> |Success| ResolveLocation["Resolve with location data"]
PrimaryRequest --> |Error| CheckErrorType{"Error Type?"}
CheckErrorType --> |TIMEOUT| FallbackRequest["Call fallback with lower accuracy"]
CheckErrorType --> |POSITION_UNAVAILABLE| FallbackRequest
CheckErrorType --> |PERMISSION_DENIED| ResolveNull["Resolve with null"]
FallbackRequest --> |Success| ResolveLocation
FallbackRequest --> |Error| ResolveNull
GetNativeLocation --> VerifyPermission["Verify location permission"]
VerifyPermission --> |Denied| ReturnNull
VerifyPermission --> |Granted| GetPosition["Call getCurrentPositionAsync with BestForNavigation"]
GetPosition --> |Success| FormatLocation["Format location data"]
GetPosition --> |Error| ReturnNull
FormatLocation --> ResolveLocation
ResolveLocation --> End([Return Location])
ResolveNull --> End
ReturnNull --> End
style Start fill:#4682B4,stroke:#333,stroke-width:2px
style End fill:#4682B4,stroke:#333,stroke-width:2px
style ResolveLocation fill:#2ECC71,stroke:#333,stroke-width:2px
style ResolveNull fill:#E74C3C,stroke:#333,stroke-width:2px
style ReturnNull fill:#E74C3C,stroke:#333,stroke-width:2px
```

**Diagram sources**
- [locationService.ts](file://services/locationService.ts#L69-L209)
- [Map.web.tsx](file://components/Map.web.tsx#L1-L330)

**Section sources**
- [locationService.ts](file://services/locationService.ts#L69-L209)
- [Map.web.tsx](file://components/Map.web.tsx#L1-L330)
- [Map.tsx](file://components/Map.tsx#L1-L294)

## getCurrentLocation Method Analysis

```mermaid
sequenceDiagram
participant Consumer as "Consumer Dashboard"
participant LocationService as "LocationService"
participant WebAPI as "navigator.geolocation"
participant ExpoLocation as "Expo Location"
Consumer->>LocationService : getCurrentLocation()
alt Web Platform
LocationService->>LocationService : Check geolocation availability
LocationService->>LocationService : Check permission state
alt Permission Denied
LocationService-->>Consumer : Return null
else Permission Granted
LocationService->>WebAPI : getCurrentPosition (high accuracy)
WebAPI-->>LocationService : Success with location
LocationService-->>Consumer : Return location data
alt Primary Request Fails
LocationService->>WebAPI : getCurrentPosition (fallback, lower accuracy)
WebAPI-->>LocationService : Success with location
LocationService-->>Consumer : Return location data
end
end
else Native Platform
LocationService->>ExpoLocation : requestForegroundPermissionsAsync()
alt Permission Denied
LocationService-->>Consumer : Return null
else Permission Granted
LocationService->>ExpoLocation : getCurrentPositionAsync (BestForNavigation)
ExpoLocation-->>LocationService : Success with location
LocationService-->>Consumer : Return location data
end
end
```

**Diagram sources**
- [locationService.ts](file://services/locationService.ts#L69-L209)
- [consumer.tsx](file://app/dashboard/consumer.tsx#L175-L222)

**Section sources**
- [locationService.ts](file://services/locationService.ts#L69-L209)
- [consumer.tsx](file://app/dashboard/consumer.tsx#L175-L222)

## Reverse Geocoding with OpenStreetMap

```mermaid
flowchart TD
Start([Reverse Geocode]) --> CheckPlatform{"Platform Type?"}
CheckPlatform --> |Web| CallNominatim["Call OpenStreetMap Nominatim API"]
CheckPlatform --> |Native| CallExpoLocation["Call Expo Location.reverseGeocodeAsync()"]
CallNominatim --> CheckResponse{"Response OK?"}
CheckResponse --> |Yes| ParseData["Parse JSON response"]
CheckResponse --> |No| FormatCoordinates["Format as lat,lng"]
ParseData --> ExtractAddress["Extract display_name or address components"]
ExtractAddress --> |Success| ReturnAddress["Return formatted address"]
ExtractAddress --> |No display_name| FormatCoordinates
FormatCoordinates --> ReturnCoordinates["Return formatted coordinates"]
CallExpoLocation --> CheckResults{"Results.length > 0?"}
CheckResults --> |Yes| ExtractNativeAddress["Extract street, city, region, country"]
CheckResults --> |No| FormatCoordinates
ExtractNativeAddress --> FormatNative["Format as street city, region country"]
FormatNative --> ReturnAddress
ReturnAddress --> End([Return address string])
ReturnCoordinates --> End
style Start fill:#4682B4,stroke:#333,stroke-width:2px
style End fill:#4682B4,stroke:#333,stroke-width:2px
style ReturnAddress fill:#2ECC71,stroke:#333,stroke-width:2px
style ReturnCoordinates fill:#F39C12,stroke:#333,stroke-width:2px
```

**Diagram sources**
- [locationService.ts](file://services/locationService.ts#L213-L246)
- [environment.ts](file://config/environment.ts#L1-L52)

**Section sources**
- [locationService.ts](file://services/locationService.ts#L213-L246)

## Integration with Consumer Dashboard

```mermaid
sequenceDiagram
participant Consumer as "Consumer Dashboard"
participant LocationService as "LocationService"
participant MapContainer as "MapContainer"
participant MapErrorBoundary as "MapErrorBoundary"
Consumer->>LocationService : checkLocationStatus()
LocationService->>Browser : navigator.permissions.query(geolocation)
Browser-->>LocationService : Permission state
LocationService-->>Consumer : Set location status
Consumer->>LocationService : getCurrentLocation()
LocationService-->>Consumer : Return location or null
Consumer->>MapContainer : Render with region
MapContainer->>MapErrorBoundary : Wrap Map component
MapErrorBoundary->>Map : Render map
alt Map Error
Map-->>MapErrorBoundary : Throw error
MapErrorBoundary->>MapErrorBoundary : Display error UI
MapErrorBoundary->>User : Show retry button
User->>MapErrorBoundary : Click retry
MapErrorBoundary->>Map : Re-render
end
Consumer->>LocationService : onRegionChangeComplete
LocationService->>Supabase : broadcastLocationToSupabase()
Supabase-->>LocationService : Success or error
```

**Diagram sources**
- [consumer.tsx](file://app/dashboard/consumer.tsx#L174-L222)
- [MapContainer.tsx](file://app/_components/MapContainer.tsx#L1-L286)
- [MapErrorBoundary.tsx](file://app/_components/MapErrorBoundary.tsx#L1-L109)

**Section sources**
- [consumer.tsx](file://app/dashboard/consumer.tsx#L174-L222)
- [MapContainer.tsx](file://app/_components/MapContainer.tsx#L1-L286)
- [MapErrorBoundary.tsx](file://app/_components/MapErrorBoundary.tsx#L1-L109)

## Error Handling and Recovery

```mermaid
flowchart TD
Start([Error Occurs]) --> IdentifyError{"Error Type?"}
IdentifyError --> |Permission Denied| HandlePermission["Show user-friendly message"]
HandlePermission --> SuggestSolution["Suggest enabling location in settings"]
SuggestSolution --> End
IdentifyError --> |Position Unavailable| WaitFallback["Wait for fallback attempt"]
WaitFallback --> CheckFallback{"Fallback successful?"}
CheckFallback --> |Yes| UseFallbackLocation["Use fallback location data"]
CheckFallback --> |No| ReturnNull["Return null location"]
UseFallbackLocation --> End
ReturnNull --> End
IdentifyError --> |Timeout| ActivateFallback["Activate fallback mechanism"]
ActivateFallback --> RequestLowerAccuracy["Request with lower accuracy settings"]
RequestLowerAccuracy --> CheckFallback
ReturnNull --> End
IdentifyError --> |Network Error| CheckCache{"Valid cached location?"}
CheckCache --> |Yes| ReturnCached["Return cached location with isStale flag"]
CheckCache --> |No| ReturnNull
IdentifyError --> |Supabase Broadcast Error| CheckErrorCode{"Error code 401?"}
CheckErrorCode --> |Yes| LogAuthError["Log authentication error"]
CheckErrorCode --> |No| LogGeneralError["Log general error"]
LogAuthError --> End
LogGeneralError --> End
style Start fill:#4682B4,stroke:#333,stroke-width:2px
style End fill:#4682B4,stroke:#333,stroke-width:2px
style UseFallbackLocation fill:#2ECC71,stroke:#333,stroke-width:2px
style ReturnCached fill:#F39C12,stroke:#333,stroke-width:2px
style ReturnNull fill:#E74C3C,stroke:#333,stroke-width:2px
```

**Diagram sources**
- [locationService.ts](file://services/locationService.ts#L153-L168)
- [MapErrorBoundary.tsx](file://app/_components/MapErrorBoundary.tsx#L1-L109)
- [consumer.tsx](file://app/dashboard/consumer.tsx#L964-L1004)

**Section sources**
- [locationService.ts](file://services/locationService.ts#L153-L168)
- [MapErrorBoundary.tsx](file://app/_components/MapErrorBoundary.tsx#L1-L109)
- [consumer.tsx](file://app/dashboard/consumer.tsx#L964-L1004)

## Best Practices and Optimization

```mermaid
flowchart TD
Start([Location Best Practices]) --> BatteryConservation["Battery Conservation"]
Start --> AccuracyOptimization["Accuracy Optimization"]
Start --> PerformanceOptimization["Performance Optimization"]
Start --> ErrorResilience["Error Resilience"]
BatteryConservation --> UseHighAccuracy["Use high accuracy only when necessary"]
BatteryConservation --> ImplementCaching["Implement location caching (5 min)"]
BatteryConservation --> StopTracking["Stop live tracking when not needed"]
BatteryConservation --> UseEfficientIntervals["Use appropriate update intervals"]
AccuracyOptimization --> PlatformSpecific["Use platform-specific best accuracy settings"]
AccuracyOptimization --> WebFallback["Implement web fallback with timeout"]
AccuracyOptimization --> NativeBest["Use BestForNavigation on native platforms"]
AccuracyOptimization --> ValidateData["Validate location accuracy before use"]
PerformanceOptimization --> BatchUpdates["Batch location updates when possible"]
PerformanceOptimization --> QueueProcessing["Process location queue with timeout"]
PerformanceOptimization --> LimitHistory["Limit movement history size"]
PerformanceOptimization --> DebounceCalls["Debounce frequent location requests"]
ErrorResilience --> MultipleAttempts["Implement multiple retry attempts"]
ErrorResilience --> FallbackMechanisms["Use fallback location mechanisms"]
ErrorResilience --> GracefulDegradation["Gracefully degrade functionality"]
ErrorResilience --> InformUser["Inform user of location issues"]
style Start fill:#4682B4,stroke:#333,stroke-width:2px
style BatteryConservation fill:#3498DB,stroke:#333,stroke-width:2px
style AccuracyOptimization fill:#2ECC71,stroke:#333,stroke-width:2px
style PerformanceOptimization fill:#F39C12,stroke:#333,stroke-width:2px
style ErrorResilience fill:#E74C3C,stroke:#333,stroke-width:2px
```

**Diagram sources**
- [locationService.ts](file://services/locationService.ts#L35-L36)
- [locationService.ts](file://services/locationService.ts#L504-L532)
- [locationService.ts](file://services/locationService.ts#L355-L360)
- [consumer.tsx](file://app/dashboard/consumer.tsx#L964-L971)

**Section sources**
- [locationService.ts](file://services/locationService.ts#L35-L36)
- [locationService.ts](file://services/locationService.ts#L504-L532)
- [locationService.ts](file://services/locationService.ts#L355-L360)
- [consumer.tsx](file://app/dashboard/consumer.tsx#L964-L971)