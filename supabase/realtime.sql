
-- Enable realtime for tables that need live updates

DO $$
DECLARE
  table_name text;
  realtime_tables text[] := ARRAY[
    'users',
    'orders',
    'order_items',
    'notifications',
    'messages',
    'conversations',
    'products',
    'drivers',
    'cart_items',
    'driver_locations',
    'order_locations',
    'merchants',
    'user_privacy_settings',
    'data_deletion_requests',
    'data_export_requests',
    'transactions',
    'wallet_balances',
    'withdrawal_requests'
  ];
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    RAISE EXCEPTION 'Required publication supabase_realtime does not exist';
  END IF;

  FOREACH table_name IN ARRAY realtime_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      RAISE EXCEPTION 'Required Realtime table public.% is missing', table_name;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END;
$$;

-- Grant necessary permissions for real-time subscriptions
GRANT SELECT ON TABLE
  users,
  orders,
  order_items,
  notifications,
  messages,
  conversations,
  products,
  drivers,
  cart_items,
  driver_locations,
  order_locations,
  merchants,
  user_privacy_settings,
  data_deletion_requests,
  data_export_requests,
  transactions,
  wallet_balances,
  withdrawal_requests
TO authenticated;
