
-- Messages table for real-time chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Reels table
CREATE TABLE public.reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_url TEXT,
  caption TEXT,
  music_title TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reels"
ON public.reels FOR SELECT USING (true);

CREATE POLICY "Users can create reels"
ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reels"
ON public.reels FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reels"
ON public.reels FOR DELETE USING (auth.uid() = user_id);
