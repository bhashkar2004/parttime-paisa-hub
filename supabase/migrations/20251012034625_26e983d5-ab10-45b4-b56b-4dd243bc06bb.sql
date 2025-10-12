-- Remove existing permissive policies on resumes bucket
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view resumes" ON storage.objects;

-- Only authenticated users can upload their own resumes to their folder
CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own resumes
CREATE POLICY "Users can view their own resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Job owners can view resumes for applications to their jobs
CREATE POLICY "Job owners can view application resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] IN (
    SELECT user_id::text FROM applications WHERE job_id IN (
      SELECT id FROM jobs WHERE user_id = auth.uid()
    )
  )
);

-- Users can update their own resumes
CREATE POLICY "Users can update their own resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own resumes
CREATE POLICY "Users can delete their own resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);