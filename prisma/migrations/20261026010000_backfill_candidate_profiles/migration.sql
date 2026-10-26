-- Accounts may predate BE2, or have been provisioned without a profile.
-- Preserve existing profile data/version; do not create profiles for other roles.
INSERT INTO candidate_profile (user_id)
SELECT account.id
FROM user_account AS account
WHERE EXISTS (
  SELECT 1 FROM user_role AS role
  WHERE role.user_id = account.id AND role.role = 'CANDIDATE'
)
ON CONFLICT (user_id) DO NOTHING;
