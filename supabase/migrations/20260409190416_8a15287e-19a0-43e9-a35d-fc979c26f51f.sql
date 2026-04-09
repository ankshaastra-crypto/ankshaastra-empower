
-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Add storage_url column to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS storage_url text;

-- Storage policies: allow service role to upload
CREATE POLICY "Service role can upload invoices"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices');

-- Allow reading invoices (via signed URLs)
CREATE POLICY "Allow reading invoices"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices');
