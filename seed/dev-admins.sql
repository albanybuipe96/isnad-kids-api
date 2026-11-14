-- Local development admin users. Production: add real people the same way with
--   npx wrangler d1 execute isnad-kids --remote --command "INSERT INTO admin_users ..."
-- Emails must be lower-case and match the address people use to sign in to Cloudflare Access.
INSERT OR IGNORE INTO admin_users (email, name, role, active, created_at) VALUES
  ('you@example.com', 'Founder', 'admin', 1, unixepoch() * 1000),
  ('editor@example.com', 'Content editor', 'editor', 1, unixepoch() * 1000),
  ('reviewer@example.com', 'Scholar reviewer', 'reviewer', 1, unixepoch() * 1000);
