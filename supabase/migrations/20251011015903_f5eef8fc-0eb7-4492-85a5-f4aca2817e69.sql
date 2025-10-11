-- Add company_photo column to jobs table
ALTER TABLE public.jobs
ADD COLUMN company_photo text;

-- Make age_limit not required (already nullable)
-- Make contact_phone and contact_email nullable for local shops
ALTER TABLE public.jobs
ALTER COLUMN contact_phone DROP NOT NULL,
ALTER COLUMN contact_email DROP NOT NULL;

-- Update applications table - add user_id to track who applied
ALTER TABLE public.applications
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Make some fields in applications optional
ALTER TABLE public.applications
ALTER COLUMN qualification DROP NOT NULL;

-- Add policy for users to view their own applications
CREATE POLICY "Users can view their own applications"
ON public.applications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add policy for users to update their own applications
CREATE POLICY "Users can update their own applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Add policy for users to delete their own applications
CREATE POLICY "Users can delete their own applications"
ON public.applications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Update insert policy for applications
DROP POLICY IF EXISTS "Anyone can create applications" ON public.applications;

CREATE POLICY "Authenticated users can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Add policy for job owners to view applications for their jobs
CREATE POLICY "Job owners can view applications for their jobs"
ON public.applications
FOR SELECT
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE user_id = auth.uid()
  )
);

-- Update storage bucket for company photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-photos', 'company-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company photos
CREATE POLICY "Authenticated users can upload company photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-photos'
);

CREATE POLICY "Anyone can view company photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-photos');

CREATE POLICY "Users can update their company photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'company-photos');

CREATE POLICY "Users can delete their company photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'company-photos');