alter table if exists public.apple_user_content
  add column if not exists position_seconds real,
  add column if not exists duration_seconds real;

comment on column public.apple_user_content.position_seconds is
  'Exact current playback position in seconds for frame-accurate resume.';

comment on column public.apple_user_content.duration_seconds is
  'Known media duration in seconds from player telemetry.';
