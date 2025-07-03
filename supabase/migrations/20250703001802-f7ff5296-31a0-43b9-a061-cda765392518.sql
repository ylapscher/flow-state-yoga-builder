-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create poses table for yoga pose repository
CREATE TABLE public.poses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  category TEXT CHECK (category IN ('standing', 'seated', 'balance', 'backbend', 'forward_fold', 'twist', 'inversion', 'core', 'relaxation')) DEFAULT 'standing',
  instructions TEXT,
  benefits TEXT,
  precautions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for poses (publicly readable)
ALTER TABLE public.poses ENABLE ROW LEVEL SECURITY;

-- Create policy for poses - readable by authenticated users
CREATE POLICY "Poses are viewable by authenticated users" 
ON public.poses 
FOR SELECT 
TO authenticated
USING (true);

-- Create sequences table for user yoga sequences
CREATE TABLE public.sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (45, 60, 75)),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

-- Create policies for sequences
CREATE POLICY "Users can view their own sequences" 
ON public.sequences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sequences" 
ON public.sequences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences" 
ON public.sequences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sequences" 
ON public.sequences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create sequence_poses junction table
CREATE TABLE public.sequence_poses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  pose_id UUID NOT NULL REFERENCES public.poses(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  custom_duration_minutes DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sequence_poses ENABLE ROW LEVEL SECURITY;

-- Create policy for sequence_poses - users can only access poses for their own sequences
CREATE POLICY "Users can view poses for their own sequences" 
ON public.sequence_poses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sequences s 
    WHERE s.id = sequence_poses.sequence_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert poses for their own sequences" 
ON public.sequence_poses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sequences s 
    WHERE s.id = sequence_poses.sequence_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update poses for their own sequences" 
ON public.sequence_poses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.sequences s 
    WHERE s.id = sequence_poses.sequence_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete poses for their own sequences" 
ON public.sequence_poses 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.sequences s 
    WHERE s.id = sequence_poses.sequence_id 
    AND s.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_poses_updated_at
  BEFORE UPDATE ON public.poses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sequences_updated_at
  BEFORE UPDATE ON public.sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample yoga poses
INSERT INTO public.poses (name, description, duration_minutes, difficulty_level, category, instructions, benefits) VALUES
('Mountain Pose', 'A foundational standing pose that teaches proper alignment', 1.0, 'beginner', 'standing', 'Stand tall with feet hip-width apart, arms at sides', 'Improves posture and balance'),
('Downward Facing Dog', 'An inverted V-shape pose that strengthens and stretches', 2.0, 'beginner', 'standing', 'From hands and knees, lift hips up and back', 'Strengthens arms and legs, stretches spine'),
('Child''s Pose', 'A gentle resting pose', 2.0, 'beginner', 'relaxation', 'Kneel and sit back on heels, fold forward with arms extended', 'Calms the mind and relieves stress'),
('Warrior I', 'A powerful standing pose', 1.5, 'beginner', 'standing', 'Step one foot back, bend front knee, raise arms overhead', 'Strengthens legs and improves focus'),
('Tree Pose', 'A balancing pose on one leg', 1.0, 'intermediate', 'balance', 'Stand on one leg, place other foot on inner thigh', 'Improves balance and concentration'),
('Cat-Cow Stretch', 'A gentle spinal warm-up', 1.5, 'beginner', 'core', 'On hands and knees, arch and round the spine', 'Improves spinal flexibility'),
('Cobra Pose', 'A gentle backbend', 1.0, 'beginner', 'backbend', 'Lie face down, press palms to lift chest', 'Strengthens back muscles'),
('Seated Forward Fold', 'A calming forward bend', 2.0, 'beginner', 'forward_fold', 'Sit with legs extended, fold forward over legs', 'Stretches hamstrings and calms mind'),
('Triangle Pose', 'A side-stretching standing pose', 1.5, 'intermediate', 'standing', 'Stand wide, reach one hand to floor, other to sky', 'Stretches sides and improves balance'),
('Savasana', 'Final relaxation pose', 5.0, 'beginner', 'relaxation', 'Lie flat on back, completely relax', 'Deep relaxation and integration');