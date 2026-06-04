-- Unify tourist expedition flow on rooms (room_code + room_members + room_activities).

CREATE OR REPLACE FUNCTION public.join_room_by_code(p_room_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_room
  FROM public.rooms
  WHERE lower(trim(room_code)) = lower(trim(p_room_code))
  LIMIT 1;

  IF v_room.id IS NULL THEN
    RAISE EXCEPTION 'Invalid room code';
  END IF;

  IF v_room.status IS DISTINCT FROM 'active'::public.room_status THEN
    RAISE EXCEPTION 'This expedition room is not active';
  END IF;

  INSERT INTO public.room_members (room_id, profile_id)
  VALUES (v_room.id, auth.uid())
  ON CONFLICT (room_id, profile_id) DO NOTHING;

  RETURN jsonb_build_object(
    'room_id', v_room.id,
    'trip_id', v_room.trip_id,
    'room_code', v_room.room_code
  );
END;
$$;

COMMENT ON FUNCTION public.join_room_by_code(TEXT) IS
  'Tourist redeems moderator room_code; idempotent room_members insert.';

CREATE OR REPLACE FUNCTION public.tourist_complete_room_activity(p_activity_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_act public.room_activities%ROWTYPE;
  v_xp INTEGER := 25;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_act
  FROM public.room_activities
  WHERE id = p_activity_id;

  IF v_act.id IS NULL THEN
    RAISE EXCEPTION 'Activity not found';
  END IF;

  IF NOT public.is_room_member(v_act.room_id) THEN
    RAISE EXCEPTION 'Not a member of this expedition';
  END IF;

  IF v_act.status = 'completed'::public.activity_status THEN
    RAISE EXCEPTION 'Activity already completed';
  END IF;

  IF v_act.status IS DISTINCT FROM 'in_progress'::public.activity_status THEN
    RAISE EXCEPTION 'Activity is not ready to complete yet';
  END IF;

  UPDATE public.room_activities
  SET status = 'completed'::public.activity_status,
      updated_at = timezone('utc', now())
  WHERE id = p_activity_id;

  RETURN jsonb_build_object('xp_reward', v_xp, 'activity_id', p_activity_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_room_by_code(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tourist_complete_room_activity(UUID) TO authenticated, service_role;
