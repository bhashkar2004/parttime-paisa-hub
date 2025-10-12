-- Add salary column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN salary text;

-- Add comment for clarity
COMMENT ON COLUMN public.jobs.salary IS 'Salary information for the job posting';