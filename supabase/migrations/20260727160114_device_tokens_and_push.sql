-- ─────────────────────────────────────────────────────────────────────────────
-- device_tokens table  +  order-status push trigger
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Device token storage (one row per user × platform)
CREATE TABLE IF NOT EXISTS device_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL,
  platform    TEXT        NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens(user_id);

-- 2. Enable pg_net so triggers can make HTTP calls (pre-installed on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Human-readable status labels used in push body
CREATE OR REPLACE FUNCTION order_status_label(status TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE status
    WHEN 'pending'    THEN 'Order placed — waiting for confirmation'
    WHEN 'accepted'   THEN 'Order confirmed by merchant'
    WHEN 'preparing'  THEN 'Merchant is preparing your order'
    WHEN 'ready'      THEN 'Order ready — driver en route to pick up'
    WHEN 'in_transit' THEN 'Driver is on the way to you!'
    WHEN 'delivered'  THEN 'Order delivered. Enjoy!'
    WHEN 'cancelled'  THEN 'Order has been cancelled'
    WHEN 'rejected'   THEN 'Order was rejected'
    ELSE 'Order status updated: ' || status
  END;
$$;

-- 4. Trigger function — fires after orders.status changes.
--    Calls the send-push-notification Edge Function via pg_net.
--
--    REQUIRED: set these two config params in Supabase dashboard →
--    Project Settings → Database → "Additional configuration parameters":
--      app.supabase_url      = https://<project-ref>.supabase.co
--      app.supabase_anon_key = <your-anon-key>
--
CREATE OR REPLACE FUNCTION trigger_push_on_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_url      TEXT := current_setting('app.supabase_url',      true);
  v_key      TEXT := current_setting('app.supabase_anon_key', true);
  v_label    TEXT := order_status_label(NEW.status);
  v_edge     TEXT;
  v_payload  JSONB;
BEGIN
  -- Skip if status did not actually change
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Only proceed if we have the required settings
  IF v_url IS NULL OR v_url = '' OR v_key IS NULL OR v_key = '' THEN
    RAISE LOG 'send-push-notification skipped: app.supabase_url / app.supabase_anon_key not configured';
    RETURN NEW;
  END IF;

  v_edge := v_url || '/functions/v1/send-push-notification';

  -- Notify consumer on every status change
  IF NEW.consumer_id IS NOT NULL THEN
    v_payload := jsonb_build_object(
      'user_id', NEW.consumer_id,
      'title',   'Order Update',
      'body',    v_label,
      'data',    jsonb_build_object(
                   'orderId', NEW.id,
                   'status',  NEW.status,
                   'screen',  'order-tracking'
                 )
    );
    PERFORM net.http_post(
      url     := v_edge,
      body    := v_payload,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || v_key
      )
    );
  END IF;

  -- Notify driver when newly assigned or status progresses
  IF NEW.driver_id IS NOT NULL THEN
    IF OLD.driver_id IS NULL THEN
      -- Fresh assignment
      v_payload := jsonb_build_object(
        'user_id', NEW.driver_id,
        'title',   'New Delivery Assignment',
        'body',    'You have been assigned a new order. Tap to view.',
        'data',    jsonb_build_object(
                     'orderId', NEW.id,
                     'status',  NEW.status,
                     'screen',  'driver-orders'
                   )
      );
    ELSE
      -- Status update while assigned
      v_payload := jsonb_build_object(
        'user_id', NEW.driver_id,
        'title',   'Order Status Changed',
        'body',    'Order ' || substring(NEW.id::text from 1 for 8) || ' is now: ' || NEW.status,
        'data',    jsonb_build_object(
                     'orderId', NEW.id,
                     'status',  NEW.status,
                     'screen',  'driver-orders'
                   )
      );
    END IF;

    PERFORM net.http_post(
      url     := v_edge,
      body    := v_payload,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || v_key
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Attach the trigger (idempotent)
DROP TRIGGER IF EXISTS orders_status_change_push ON orders;
CREATE TRIGGER orders_status_change_push
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_on_order_status_change();
