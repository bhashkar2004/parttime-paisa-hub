-- Drop admin-only policies on jobs table
DROP POLICY IF EXISTS "Only admins can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Only admins can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Only admins can delete jobs" ON public.jobs;

-- Allow all authenticated users to create jobs
CREATE POLICY "Authenticated users can create jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own jobs
CREATE POLICY "Users can update their own jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own jobs
CREATE POLICY "Users can delete their own jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);