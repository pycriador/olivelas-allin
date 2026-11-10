-- Create games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  media_type TEXT DEFAULT '',
  description TEXT DEFAULT '',
  price TEXT NOT NULL,
  url TEXT DEFAULT '',
  original_text TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Anyone can view games (for export)
CREATE POLICY "Anyone can view games"
ON public.games
FOR SELECT
USING (true);

-- Only authenticated users can insert their own games
CREATE POLICY "Users can insert their own games"
ON public.games
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only owners can update their games
CREATE POLICY "Users can update their own games"
ON public.games
FOR UPDATE
USING (auth.uid() = user_id);

-- Only owners can delete their games
CREATE POLICY "Users can delete their own games"
ON public.games
FOR DELETE
USING (auth.uid() = user_id);