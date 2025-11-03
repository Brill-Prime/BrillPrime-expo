# Service Migration to Supabase - TODO List

## realtimeService Expansion

- [x] Add realtime subscription for escrow transactions
- [x] Add realtime subscription for notifications
- [x] Add realtime subscription for reviews/ratings
- [x] Add realtime subscription for user status updates
- [x] Add realtime subscription for payment status updates
- [x] Add realtime subscription for toll payments
- [x] Add realtime subscription for KYC status updates

## escrowService Migration

- [x] Replace getEscrowTransactions() with Supabase query
- [x] Replace getEscrowDetails() with Supabase query
- [x] Replace releaseEscrow() with Supabase update
- [x] Replace disputeEscrow() with Supabase update
- [x] Update interfaces to match Supabase schema

## adminService Migration

- [ ] Replace getSystemMetrics() with Supabase queries
- [ ] Replace getAnalytics() with Supabase queries
- [ ] Replace getUsers() with Supabase query
- [ ] Replace user management methods (block, suspend, etc.) with Supabase updates
- [ ] Replace KYC management methods with Supabase queries/updates
- [ ] Replace escrow management methods with Supabase queries/updates
- [ ] Replace content moderation methods with Supabase queries/updates
- [ ] Replace announcement methods with Supabase operations
- [ ] Replace maintenance mode methods with Supabase updates
- [ ] Replace export methods with Supabase queries

## analyticsService Migration

- [x] Create analytics_events table in Supabase schema
- [x] Replace flush() method to store events in Supabase
- [x] Update event tracking to use Supabase storage

## Schema Updates

- [x] Add analytics_events table to supabase-schema.sql
- [ ] Update RLS policies for admin access
- [ ] Add necessary indexes for performance

## Testing & Validation

- [ ] Test realtime subscriptions for all data types
- [ ] Test escrow operations with Supabase
- [ ] Test admin operations with Supabase
- [ ] Test analytics event storage
- [ ] Verify RLS policies work correctly
- [ ] Update dependent components if needed
