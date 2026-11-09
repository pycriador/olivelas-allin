
-- Allow anon to check if email is authorized (needed for signup)
CREATE POLICY "Anyone can check authorized emails"
  ON public.authorized_emails FOR SELECT
  TO anon
  USING (true);
