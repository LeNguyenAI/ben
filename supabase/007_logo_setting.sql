insert into public.site_settings (setting_key, setting_value)
values
  ('logo_url', '/ben-chill-logo.png'),
  ('email', 'cskhbenchillgarden@gmail.com')
on conflict (setting_key) do update
set setting_value = excluded.setting_value;
