DROP INDEX IF EXISTS public.idx_interaction_notes_is_done;
ALTER TABLE public.interaction_notes
DROP COLUMN IF EXISTS is_done;