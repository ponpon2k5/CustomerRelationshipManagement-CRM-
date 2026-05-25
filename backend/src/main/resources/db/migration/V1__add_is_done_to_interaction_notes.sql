-- Add is_done flag to interaction_notes
ALTER TABLE public.interaction_notes
ADD COLUMN IF NOT EXISTS is_done BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional: index nếu bạn hay filter theo is_done
CREATE INDEX IF NOT EXISTS idx_interaction_notes_is_done
ON public.interaction_notes (is_done);