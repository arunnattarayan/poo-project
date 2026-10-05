-- Add payment verification features to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_receipt_url text,
  ADD COLUMN IF NOT EXISTS payment_verified boolean NOT NULL DEFAULT false;
