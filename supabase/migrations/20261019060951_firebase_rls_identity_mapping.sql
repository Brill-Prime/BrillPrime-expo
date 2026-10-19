-- Map Firebase JWT subjects to BrillPrime's UUID profile IDs before RLS checks.
-- Firebase UIDs are text, so auth.uid() (which casts JWT sub to UUID) is not
-- compatible with this identity provider. This migration fails closed unless
-- Supabase accepts a third-party token with role='authenticated'.

CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO anon, authenticated;

CREATE OR REPLACE FUNCTION app_private.current_user_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT u.id
  FROM public.users AS u
  WHERE u.firebase_uid = (SELECT auth.jwt() ->> 'sub')
    AND (SELECT auth.jwt() ->> 'role') = 'authenticated'
    AND u.is_active IS NOT FALSE
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION app_private.current_user_profile_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.current_user_profile_id() TO anon, authenticated;

-- Most policies compare auth.uid() with UUID profile/owner columns. Resolve the
-- Firebase subject to the matching UUID profile. Policies that explicitly
-- compare against users.firebase_uid must compare the raw JWT subject instead.
DO $policy_rewrite$
DECLARE
  p record;
  new_qual text;
  new_check text;
  statement text;
  uses_firebase_uid boolean;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        COALESCE(qual, '') LIKE '%auth.uid()%'
        OR COALESCE(with_check, '') LIKE '%auth.uid()%'
      )
  LOOP
    uses_firebase_uid :=
      (COALESCE(p.qual, '') || COALESCE(p.with_check, '')) LIKE '%firebase_uid%';

    IF uses_firebase_uid THEN
      new_qual := replace(p.qual, 'auth.uid()', '(SELECT auth.jwt() ->> ''sub'')');
      new_check := replace(p.with_check, 'auth.uid()', '(SELECT auth.jwt() ->> ''sub'')');
    ELSE
      new_qual := replace(p.qual, 'auth.uid()', '(SELECT app_private.current_user_profile_id())');
      new_check := replace(p.with_check, 'auth.uid()', '(SELECT app_private.current_user_profile_id())');
    END IF;

    statement := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF p.qual IS NOT NULL THEN
      statement := statement || format(' USING (%s)', new_qual);
    END IF;
    IF p.with_check IS NOT NULL THEN
      statement := statement || format(' WITH CHECK (%s)', new_check);
    END IF;
    EXECUTE statement;
  END LOOP;
END;
$policy_rewrite$;

-- The previous SELECT policy allowed any user to read notifications for any
-- supported role. The app queries a user's own notifications, so enforce owner
-- access at the database layer instead of using role values as a broad grant.
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT app_private.current_user_profile_id()));
