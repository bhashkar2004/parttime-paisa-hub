ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS applications_user_id_created_at_idx
ON public.applications (user_id, created_at DESC);