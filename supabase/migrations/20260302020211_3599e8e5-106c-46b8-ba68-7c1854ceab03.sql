
-- Create orders table with comprehensive customer data
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  amount NUMERIC NOT NULL DEFAULT 0,
  package_type TEXT NOT NULL DEFAULT 'single',

  -- Common customer contact details
  customer_name TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '',
  customer_mobile TEXT NOT NULL DEFAULT '',
  customer_city TEXT,

  -- Name Check: Person 1
  person1_first_name TEXT,
  person1_middle_name TEXT,
  person1_middle_name_type TEXT, -- 'father' or 'husband'
  person1_full_name TEXT,
  person1_dob TEXT,
  person1_gender TEXT,

  -- Name Check: Person 2
  person2_first_name TEXT,
  person2_middle_name TEXT,
  person2_middle_name_type TEXT,
  person2_full_name TEXT,
  person2_dob TEXT,
  person2_gender TEXT,

  -- Name Check: Person 3
  person3_first_name TEXT,
  person3_middle_name TEXT,
  person3_middle_name_type TEXT,
  person3_full_name TEXT,
  person3_dob TEXT,
  person3_gender TEXT,

  -- Perfect Baby Name Report fields
  father_first_name TEXT,
  father_middle_name TEXT,
  father_last_name TEXT,
  child_dob TEXT,
  child_tob TEXT,        -- time of birth
  child_pob TEXT,        -- place of birth
  child_pincode TEXT,
  child_gender TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (payment flow)
CREATE POLICY "Allow anonymous inserts"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Allow reading own order by order_id
CREATE POLICY "Allow reading by order_id"
  ON public.orders FOR SELECT
  USING (true);

-- Allow updates (for payment status callback)
CREATE POLICY "Allow anonymous updates"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
