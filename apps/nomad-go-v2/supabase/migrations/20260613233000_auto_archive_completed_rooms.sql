-- Auto-archive a room once every one of its activities is completed.
--
-- The room timeline (room_activities) is the source of truth for progress.
-- When the final activity flips to 'completed', the room should close
-- (status -> 'archived'). If a guide reverts an activity back to
-- pending/in_progress, the room re-opens (status -> 'active') so the state
-- stays consistent regardless of which code path mutates the timeline.

CREATE OR REPLACE FUNCTION public.sync_room_status_from_activities()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_total INT;
  v_completed INT;
BEGIN
  v_room_id := COALESCE(NEW.room_id, OLD.room_id);

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'::public.activity_status)
  INTO v_total, v_completed
  FROM public.room_activities
  WHERE room_id = v_room_id;

  IF v_total > 0 AND v_total = v_completed THEN
    UPDATE public.rooms
    SET status = 'archived'::public.room_status
    WHERE id = v_room_id
      AND status <> 'archived'::public.room_status;
  ELSE
    UPDATE public.rooms
    SET status = 'active'::public.room_status
    WHERE id = v_room_id
      AND status = 'archived'::public.room_status;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.sync_room_status_from_activities() IS
  'Archives a room when all its activities are completed; re-opens it otherwise.';

DROP TRIGGER IF EXISTS trg_room_auto_archive ON public.room_activities;
CREATE TRIGGER trg_room_auto_archive
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.room_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_room_status_from_activities();
