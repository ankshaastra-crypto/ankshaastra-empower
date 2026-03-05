
-- Create invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(order_id),
  invoice_number text NOT NULL UNIQUE,
  invoice_sequence integer NOT NULL,
  financial_year text NOT NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  customer_mobile text NOT NULL DEFAULT '',
  customer_city text DEFAULT '',
  customer_state text DEFAULT '',
  customer_pincode text DEFAULT '',
  package_type text NOT NULL DEFAULT 'single',
  subtotal numeric NOT NULL DEFAULT 0,
  cgst_rate numeric NOT NULL DEFAULT 0,
  cgst_amount numeric NOT NULL DEFAULT 0,
  sgst_rate numeric NOT NULL DEFAULT 0,
  sgst_amount numeric NOT NULL DEFAULT 0,
  igst_rate numeric NOT NULL DEFAULT 0,
  igst_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  is_intra_state boolean NOT NULL DEFAULT false,
  hsn_sac_code text NOT NULL DEFAULT '998399',
  transaction_id text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (from edge function with service role)
CREATE POLICY "Allow service inserts on invoices" ON public.invoices
  FOR INSERT WITH CHECK (true);

-- Allow reading by order_id (for customers to view their invoice)
CREATE POLICY "Allow reading invoices by order_id" ON public.invoices
  FOR SELECT USING (true);

-- Create sequence tracking table for invoice numbering per financial year
CREATE TABLE public.invoice_sequences (
  financial_year text PRIMARY KEY,
  last_sequence integer NOT NULL DEFAULT 0
);

ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service access to sequences" ON public.invoice_sequences
  FOR ALL USING (true) WITH CHECK (true);

-- Function to get next invoice number atomically
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(p_financial_year text)
RETURNS TABLE(invoice_number text, sequence_num integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sequence integer;
  v_invoice_number text;
BEGIN
  -- Upsert and increment atomically
  INSERT INTO public.invoice_sequences (financial_year, last_sequence)
  VALUES (p_financial_year, 1)
  ON CONFLICT (financial_year)
  DO UPDATE SET last_sequence = invoice_sequences.last_sequence + 1
  RETURNING invoice_sequences.last_sequence INTO v_sequence;
  
  -- Format: NCS/2025-26/0001
  v_invoice_number := 'NCS/' || p_financial_year || '/' || LPAD(v_sequence::text, 4, '0');
  
  RETURN QUERY SELECT v_invoice_number, v_sequence;
END;
$$;
