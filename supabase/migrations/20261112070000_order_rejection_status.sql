ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
    'REJECTED'
  )) NOT VALID;

ALTER TABLE public.orders
  VALIDATE CONSTRAINT orders_status_check;
