-- =============================================================================
-- Hero slides: tighten CTA URL check.
-- `/\evil.com` is treated by browsers like `//evil.com` (open redirect), and the
-- previous regex only blocked `//`. Safe to re-run.
-- =============================================================================

alter table public.homepage_hero_slides drop constraint if exists hero_cta_safe_url;
alter table public.homepage_hero_slides add constraint hero_cta_safe_url
  check (
    button_url is null
    or (
      button_url !~ '\s'
      and (button_url ~ '^/([^/\\]|$)' or button_url ~ '^https://[^/\\]')
    )
  );
