-- Update poses table to use seconds instead of minutes
ALTER TABLE public.poses 
RENAME COLUMN duration_minutes TO duration_seconds;

-- Update the default value and multiply existing values by 60 to convert minutes to seconds
UPDATE public.poses 
SET duration_seconds = duration_seconds * 60
WHERE duration_seconds IS NOT NULL;

-- Update sequences table to use seconds instead of minutes  
ALTER TABLE public.sequences
RENAME COLUMN duration_minutes TO duration_seconds;

-- Update existing sequence durations from minutes to seconds
UPDATE public.sequences 
SET duration_seconds = duration_seconds * 60
WHERE duration_seconds IS NOT NULL;

-- Update sequence_poses table to use seconds instead of minutes
ALTER TABLE public.sequence_poses
RENAME COLUMN custom_duration_minutes TO custom_duration_seconds;

-- Update existing custom durations from minutes to seconds
UPDATE public.sequence_poses 
SET custom_duration_seconds = custom_duration_seconds * 60
WHERE custom_duration_seconds IS NOT NULL;