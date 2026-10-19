-- Wrap JWT claim access in stable helper functions so RLS policies can use
-- initplans rather than evaluating auth.jwt()/auth.role() for every row.
CREATE OR REPLACE FUNCTION app_private.current_jwt_claims()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT auth.jwt();
$function$;

REVOKE ALL ON FUNCTION app_private.current_jwt_claims() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.current_jwt_claims() TO anon, authenticated;

DO $policy_rewrite$
DECLARE
  p record;
  new_qual text;
  new_check text;
  statement text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        COALESCE(qual, '') LIKE '%auth.jwt()%'
        OR COALESCE(with_check, '') LIKE '%auth.jwt()%'
        OR COALESCE(qual, '') LIKE '%auth.role()%'
        OR COALESCE(with_check, '') LIKE '%auth.role()%'
      )
  LOOP
    new_qual := replace(p.qual, 'auth.jwt()', '(SELECT app_private.current_jwt_claims())');
    new_check := replace(p.with_check, 'auth.jwt()', '(SELECT app_private.current_jwt_claims())');
    new_qual := replace(new_qual, 'auth.role()', '((SELECT app_private.current_jwt_claims()) ->> ''role'')');
    new_check := replace(new_check, 'auth.role()', '((SELECT app_private.current_jwt_claims()) ->> ''role'')');

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
