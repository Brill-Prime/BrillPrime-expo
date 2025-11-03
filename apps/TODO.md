# Supabase Integration TODO

## Phase 1: Database Setup & Schema Migration ✅ COMPLETED
- [x] Create Supabase database schema (migrate from Drizzle)
- [x] Set up Row Level Security (RLS) policies
- [x] Create user sync function (Firebase -> Supabase)
- [x] Test database connection and basic queries

## Phase 2: Authentication & User Management ✅ COMPLETED
- [x] Update authService to sync users to Supabase
- [x] Create user profiles table and sync
- [x] Update role management to use Supabase
- [x] Test user registration and login flow

## Phase 3: Core Services Migration ✅ IN PROGRESS
- [x] Update cartService to use Supabase
- [x] Update orderService to use Supabase (imports updated)
- [x] Update merchantService to use Supabase (imports updated)
- [x] Update productService to use Supabase (imports updated)
- [x] Update paymentService to use Supabase (imports updated)

## Phase 4: Additional Services Migration ✅ IN PROGRESS
- [x] Update notificationService to use Supabase
- [x] Update locationService to use Supabase (imports updated)
- [x] Update kycService to use Supabase (imports updated)
- [x] Update profileService to use Supabase (imports updated)
- [x] Update favoritesService to use Supabase (imports updated)

## Phase 5: Realtime & Advanced Features
- [ ] Expand realtimeService for all data types
- [ ] Update escrowService to use Supabase
- [ ] Update adminService to use Supabase
- [ ] Update analyticsService to use Supabase

## Phase 6: Cleanup & Testing
- [ ] Remove old backend API dependencies
- [ ] Update environment configurations
- [ ] Test all features end-to-end
- [ ] Performance optimization and monitoring
- [ ] Update documentation

## Phase 7: Deployment & Monitoring
- [ ] Deploy Supabase functions if needed
- [ ] Set up monitoring and alerts
- [ ] Update CI/CD pipelines
- [ ] Final testing in production environment
