-- Add covering indexes for foreign keys flagged by the Supabase performance advisor.
-- Safe to re-run: existing indexes are left in place.
create index if not exists idx_addresses_user_id on public.addresses (user_id);
create index if not exists idx_conversations_consumer_id on public.conversations (consumer_id);
create index if not exists idx_conversations_driver_id on public.conversations (driver_id);
create index if not exists idx_conversations_merchant_id on public.conversations (merchant_id);
create index if not exists idx_conversations_order_id on public.conversations (order_id);
create index if not exists idx_kyc_documents_user_id on public.kyc_documents (user_id);
create index if not exists idx_kyc_documents_verified_by on public.kyc_documents (verified_by);
create index if not exists idx_messages_sender_id on public.messages (sender_id);
create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_product_id on public.order_items (product_id);
create index if not exists idx_order_locations_user_id on public.order_locations (user_id);
create index if not exists idx_payment_methods_user_id on public.payment_methods (user_id);
create index if not exists idx_promotions_merchant_id on public.promotions (merchant_id);
create index if not exists idx_reviews_merchant_id on public.reviews (merchant_id);
create index if not exists idx_reviews_order_id on public.reviews (order_id);
create index if not exists idx_reviews_user_id on public.reviews (user_id);
