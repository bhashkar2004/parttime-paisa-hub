-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  age_limit TEXT,
  experience TEXT,
  qualification TEXT NOT NULL,
  location TEXT NOT NULL,
  application_deadline DATE NOT NULL,
  job_type TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  qualification TEXT NOT NULL,
  gender TEXT NOT NULL,
  resume_url TEXT,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs (public read, anyone can add)
CREATE POLICY "Anyone can view jobs"
ON public.jobs
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (true);

-- Create policies for applications (public read, anyone can apply)
CREATE POLICY "Anyone can view applications"
ON public.applications
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create applications"
ON public.applications
FOR INSERT
WITH CHECK (true);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Create storage policies for resumes
CREATE POLICY "Anyone can upload resumes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Anyone can view resumes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resumes');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();