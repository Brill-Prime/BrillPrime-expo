# User Data Model

<cite>
**Referenced Files in This Document**   
- [schema.sql](file://supabase/schema.sql)
- [rls-policies.sql](file://supabase/rls-policies.sql)
- [userService.ts](file://services/userService.ts)
- [firebase.ts](file://config/firebase.ts)
- [supabase.ts](file://config/supabase.ts)
- [authService.ts](file://services/authService.ts)
- [AuthContext.tsx](file://contexts/AuthContext.tsx)
- [privacy-settings.sql](file://supabase/privacy-settings.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Entity Structure](#entity-structure)
3. [Constraints and Validation](#constraints-and-validation)
4. [Relationships with Other Entities](#relationships-with-other-entities)
5. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
6. [Updated_at Trigger](#updated_at-trigger)
7. [Common Queries](#common-queries)
8. [Data Validation and Privacy](#data-validation-and-privacy)
9. [Synchronization with Firebase Authentication](#synchronization-with-firebase-authentication)
10. [Conclusion](#conclusion)

## Introduction
The users table in Brillprime-expo serves as the central identity management system for the platform, storing core user information and establishing relationships with various roles and entities within the application. This data model is designed to support a multi-role system where users can function as consumers, merchants, drivers, or administrators. The table is integrated with Firebase Authentication for secure user management and leverages Supabase's Row Level Security (RLS) to ensure data privacy. This documentation provides a comprehensive overview of the users table structure, constraints, relationships, security policies, and operational considerations.

**Section sources**
- [schema.sql](file://supabase/schema.sql#L8-L21)
- [rls-policies.sql](file://supabase/rls-policies.sql#L17-L24)

## Entity Structure
The users table is structured with a comprehensive set of fields to support the platform's multi-role functionality and user management requirements. The primary fields include:

- **id**: UUID field serving as the primary key, automatically generated using uuid_generate_v4()
- **firebase_uid**: Text field storing the Firebase Authentication user ID, with a unique constraint
- **email**: Text field storing the user's email address, with a unique constraint
- **full_name**: Text field storing the user's full name
- **role**: Text field indicating the user's role with a check constraint limiting values to 'consumer', 'merchant', 'driver', or 'admin'
- **phone_number**: Text field for storing the user's phone number
- **profile_image_url**: Text field storing the URL to the user's profile image
- **is_verified**: Boolean flag indicating whether the user's account has been verified
- **is_active**: Boolean flag indicating whether the user's account is active
- **created_at**: Timestamp with time zone automatically set to the current time upon record creation
- **updated_at**: Timestamp with time zone automatically updated when the record is modified

The table uses UUIDs as primary keys to ensure global uniqueness and facilitate distributed systems integration. The firebase_uid field creates a direct link between the application's user records and Firebase Authentication, enabling secure identity verification and authentication flows.

**Section sources**
- [schema.sql](file://supabase/schema.sql#L8-L21)

## Constraints and Validation
The users table implements several constraints to ensure data integrity and consistency:

- **Primary Key Constraint**: The id field has a primary key constraint ensuring each user has a unique identifier
- **Unique Constraints**: Both firebase_uid and email fields have unique constraints to prevent duplicate accounts
- **Check Constraint**: The role field has a check constraint that restricts values to 'consumer', 'merchant', 'driver', or 'admin', ensuring only valid roles are assigned
- **Not Null Constraints**: The firebase_uid, email, and role fields are marked as NOT NULL, requiring these values to be present for all user records

These constraints work together to maintain data quality and prevent invalid states within the user management system. The unique constraints on firebase_uid and email prevent account duplication, while the role check constraint ensures that users can only be assigned to predefined roles within the system.

**Section sources**
- [schema.sql](file://supabase/schema.sql#L10-L14)

## Relationships with Other Entities
The users table serves as the foundation for relationships with various other entities in the system through foreign key references:

- **Merchants**: The merchants table has a user_id field that references the users table, establishing a one-to-one relationship between a user and their merchant profile
- **Orders**: The orders table references the users table through the user_id field, linking orders to the consumers who placed them
- **Notifications**: The notifications table has a user_id field that references the users table, ensuring notifications are delivered to the appropriate recipients
- **Conversations**: The conversations table references the users table through consumer_id, merchant_id, and driver_id fields, enabling messaging between different user roles
- **Payment Methods**: The payment_methods table has a user_id field that references the users table, associating payment methods with specific users
- **Addresses**: The addresses table has a user_id field that references the users table, linking delivery and billing addresses to user accounts
- **KYC Documents**: The kyc_documents table has a user_id field that references the users table, associating verification documents with user accounts
- **Reviews**: The reviews table has a user_id field that references the users table, linking reviews to the users who created them

These relationships create a comprehensive ecosystem where user identity is central to all platform interactions, from ordering and payment to communication and verification.

```mermaid
erDiagram
USERS {
uuid id PK
string firebase_uid UK
string email UK
string full_name
string role CK
string phone_number
string profile_image_url
boolean is_verified
boolean is_active
timestamp created_at
timestamp updated_at
}
MERCHANTS {
uuid id PK
uuid user_id FK
string business_name
string business_type
geography location
string address
string city
string state
string country
jsonb operating_hours
decimal rating
integer total_reviews
boolean is_verified
boolean is_active
timestamp created_at
timestamp updated_at
}
ORDERS {
uuid id PK
uuid user_id FK
uuid merchant_id FK
string status CK
decimal total_amount
decimal subtotal
decimal delivery_fee
string delivery_address
string delivery_type CK
string recipient_name
string recipient_phone
string payment_method
string payment_status
string notes
timestamp estimated_delivery
timestamp delivered_at
timestamp created_at
timestamp updated_at
}
NOTIFICATIONS {
uuid id PK
uuid user_id FK
string title
string message
string type CK
string role CK
boolean read
string priority CK
jsonb data
string action
timestamp created_at
}
USERS ||--o{ MERCHANTS : "1-to-1"
USERS ||--o{ ORDERS : "1-to-many"
USERS ||--o{ NOTIFICATIONS : "1-to-many"
USERS ||--o{ ADDRESSES : "1-to-many"
USERS ||--o{ PAYMENT_METHODS : "1-to-many"
USERS ||--o{ KYC_DOCUMENTS : "1-to-many"
USERS ||--o{ REVIEWS : "1-to-many"
```

**Diagram sources**
- [schema.sql](file://supabase/schema.sql#L8-L107)

## Row Level Security (RLS) Policies
The users table implements Row Level Security (RLS) policies to ensure that users can only access their own data, providing a critical layer of data protection:

- **Select Policy**: Users can only view their own data by matching their Firebase UID with the firebase_uid field in the users table
- **Update Policy**: Users can only update their own data by matching their Firebase UID with the firebase_uid field
- **Insert Policy**: Any authenticated user can insert new user records, allowing for user registration

These RLS policies leverage Firebase Authentication tokens to verify user identity, extracting the 'sub' claim from the JWT token to match against the firebase_uid field. This approach ensures that even if a user gains access to the database through the application, they cannot view or modify other users' data. The policies are implemented using Supabase's RLS framework, which automatically enforces these rules at the database level.

**Section sources**
- [rls-policies.sql](file://supabase/rls-policies.sql#L17-L24)

## Updated_at Trigger
The users table includes an automated timestamp management system through the updated_at trigger:

- A database function named update_updated_at_column() is defined to automatically set the updated_at field to the current timestamp before any update operation
- A trigger named update_users_updated_at is attached to the users table that executes this function before each update
- This trigger ensures that the updated_at field is consistently updated whenever any field in the user record is modified

The trigger mechanism provides reliable audit trails and enables features that depend on tracking when user information was last modified. This automation prevents the need for application-level timestamp management and ensures consistency across all update operations, regardless of how they are initiated.

**Section sources**
- [schema.sql](file://supabase/schema.sql#L213-L223)

## Common Queries
The users table supports various query patterns for user lookup and role-based filtering:

- **User Lookup by ID**: SELECT * FROM users WHERE id = 'user_id_value'
- **User Lookup by Firebase UID**: SELECT * FROM users WHERE firebase_uid = 'firebase_uid_value'
- **User Lookup by Email**: SELECT * FROM users WHERE email = 'email_value'
- **Role-Based Filtering**: SELECT * FROM users WHERE role = 'consumer' (or 'merchant', 'driver', 'admin')
- **Active Users Only**: SELECT * FROM users WHERE is_active = true
- **Verified Users Only**: SELECT * FROM users WHERE is_verified = true
- **Combined Role and Status Filtering**: SELECT * FROM users WHERE role = 'merchant' AND is_active = true AND is_verified = true

These query patterns are optimized through database indexes on the firebase_uid, email, and role fields, ensuring efficient data retrieval even as the user base grows. The queries support various application features, from authentication and profile management to administrative dashboards and reporting.

**Section sources**
- [schema.sql](file://supabase/schema.sql#L199-L201)
- [userService.ts](file://services/userService.ts#L122-L163)

## Data Validation and Privacy
The users table implementation includes comprehensive data validation and privacy considerations:

- **Data Validation**: Application-level validation ensures that email addresses are properly formatted, phone numbers follow standard patterns, and required fields are present before database operations
- **Privacy Settings**: A separate user_privacy_settings table allows users to control data collection, analytics tracking, marketing communications, location sharing, and profile visibility
- **Data Deletion Requests**: Users can request data deletion through a dedicated data_deletion_requests table that tracks the status of such requests
- **Data Export Requests**: Users can request data exports through a data_export_requests table that manages these processes
- **Field-Level Security**: Sensitive operations like password changes are handled through dedicated API endpoints rather than direct database access
- **Audit Logging**: The created_at and updated_at timestamps provide audit trails for user record modifications

These measures ensure compliance with data protection regulations and respect user privacy preferences. The separation of privacy settings from core user data allows for flexible privacy controls without compromising the integrity of the user identity system.

```mermaid
erDiagram
USERS {
uuid id PK
string firebase_uid UK
string email UK
string full_name
string role CK
string phone_number
string profile_image_url
boolean is_verified
boolean is_active
timestamp created_at
timestamp updated_at
}
USER_PRIVACY_SETTINGS {
uuid id PK
uuid user_id FK
boolean data_collection
boolean analytics
boolean marketing_emails
boolean location_tracking
boolean profile_visibility
boolean activity_status
boolean order_history
boolean share_with_partners
timestamp created_at
timestamp updated_at
}
DATA_DELETION_REQUESTS {
uuid id PK
uuid user_id FK
string email
string status CK
timestamp requested_at
timestamp processed_at
string notes
timestamp created_at
timestamp updated_at
}
DATA_EXPORT_REQUESTS {
uuid id PK
uuid user_id FK
string status CK
timestamp requested_at
timestamp processed_at
string notes
timestamp created_at
timestamp updated_at
}
USERS ||--o{ USER_PRIVACY_SETTINGS : "1-to-1"
USERS ||--o{ DATA_DELETION_REQUESTS : "1-to-many"
USERS ||--o{ DATA_EXPORT_REQUESTS : "1-to-many"
```

**Diagram sources**
- [privacy-settings.sql](file://supabase/privacy-settings.sql#L3-L35)
- [schema.sql](file://supabase/schema.sql#L8-L21)

## Synchronization with Firebase Authentication
The users table maintains tight synchronization with Firebase Authentication through several mechanisms:

- **Firebase UID Integration**: The firebase_uid field stores the Firebase Authentication user ID, creating a direct link between the application's user records and Firebase's identity management system
- **Authentication Flow**: During user registration and login, the application verifies Firebase Authentication tokens and uses the 'sub' claim to identify the user in the database
- **Token Validation**: The RLS policies extract the Firebase UID from the JWT token's 'sub' claim to enforce data access restrictions
- **User Creation**: When a new user registers through Firebase Authentication, a corresponding record is created in the users table with the Firebase UID
- **Session Management**: The application stores the Firebase UID in local storage and uses it to retrieve the corresponding user record from the database
- **Profile Synchronization**: User profile updates in the application are synchronized with both the database record and Firebase Authentication where applicable

This integration ensures a seamless authentication experience while maintaining data consistency between the identity provider and the application database. The architecture leverages Firebase Authentication for secure identity management while using the Supabase database for application-specific user data and relationships.

**Section sources**
- [firebase.ts](file://config/firebase.ts)
- [supabase.ts](file://config/supabase.ts)
- [authService.ts](file://services/authService.ts)
- [AuthContext.tsx](file://contexts/AuthContext.tsx)

## Conclusion
The users table in Brillprime-expo represents a robust and secure foundation for user management in a multi-role platform. Its design incorporates industry best practices for data integrity, security, and privacy, with primary and unique constraints ensuring data quality, RLS policies protecting user data, and integration with Firebase Authentication providing secure identity management. The table's relationships with other entities create a cohesive ecosystem where user identity is central to all platform interactions. The automated updated_at trigger ensures reliable audit trails, while comprehensive validation and privacy controls respect user preferences and regulatory requirements. This data model effectively supports the platform's operational needs while maintaining high standards of security and data protection.