DROP POLICY IF EXISTS "Authenticated can broadcast to call topics" ON realtime.messages;

CREATE POLICY "Participants can broadcast to call topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (
    realtime.topic() ~ '^calls?-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    AND (
      split_part(realtime.topic(), '-', 2) || '-' || split_part(realtime.topic(), '-', 3) || '-' || split_part(realtime.topic(), '-', 4) || '-' || split_part(realtime.topic(), '-', 5) || '-' || split_part(realtime.topic(), '-', 6)
    )::uuid IN (
      SELECT auth.uid()
      UNION
      SELECT m.receiver_id FROM public.messages m WHERE m.sender_id = auth.uid()
      UNION
      SELECT m.sender_id FROM public.messages m WHERE m.receiver_id = auth.uid()
    )
  )
  OR (
    realtime.topic() LIKE 'rtc-%'
    AND position((auth.uid())::text in realtime.topic()) > 0
  )
);

CREATE POLICY "Participants can read call signaling topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'rtc-%'
  AND position((auth.uid())::text in realtime.topic()) > 0
);