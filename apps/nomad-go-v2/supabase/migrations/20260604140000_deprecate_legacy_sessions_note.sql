-- Legacy `sessions` / `journey_*` tables are retained for historical data only.
-- Application no longer writes to them (HTTP 410 on legacy API routes).
-- Tourist enrollment: join_room_by_code → room_members; auth metadata room_id.

COMMENT ON TABLE public.sessions IS
  'DEPRECATED: use trips + rooms. Read-only archive; do not create new rows from the app.';
