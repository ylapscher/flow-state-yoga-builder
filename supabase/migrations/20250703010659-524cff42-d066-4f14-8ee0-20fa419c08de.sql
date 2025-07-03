-- Drop existing check constraints that might limit duration values
ALTER TABLE public.poses DROP CONSTRAINT IF EXISTS poses_duration_minutes_check;
ALTER TABLE public.sequences DROP CONSTRAINT IF EXISTS sequences_duration_minutes_check;
ALTER TABLE public.sequence_poses DROP CONSTRAINT IF EXISTS sequence_poses_custom_duration_minutes_check;

-- Change the column types to handle larger values for seconds
ALTER TABLE public.poses 
ALTER COLUMN duration_minutes TYPE integer;

ALTER TABLE public.sequences
ALTER COLUMN duration_minutes TYPE integer;

ALTER TABLE public.sequence_poses
ALTER COLUMN custom_duration_minutes TYPE integer;

-- Update the values to convert minutes to seconds
UPDATE public.poses 
SET duration_minutes = duration_minutes * 60
WHERE duration_minutes IS NOT NULL;

UPDATE public.sequences 
SET duration_minutes = duration_minutes * 60
WHERE duration_minutes IS NOT NULL;

UPDATE public.sequence_poses 
SET custom_duration_minutes = custom_duration_minutes * 60
WHERE custom_duration_minutes IS NOT NULL;

-- Rename the columns to reflect they now store seconds
ALTER TABLE public.poses 
RENAME COLUMN duration_minutes TO duration_seconds;

ALTER TABLE public.sequences
RENAME COLUMN duration_minutes TO duration_seconds;

ALTER TABLE public.sequence_poses
RENAME COLUMN custom_duration_minutes TO custom_duration_seconds;

-- Add new appropriate check constraints for seconds (reasonable limits)
ALTER TABLE public.poses 
ADD CONSTRAINT poses_duration_seconds_check CHECK (duration_seconds > 0 AND duration_seconds <= 7200); -- Max 2 hours

ALTER TABLE public.sequences
ADD CONSTRAINT sequences_duration_seconds_check CHECK (duration_seconds > 0 AND duration_seconds <= 14400); -- Max 4 hours

ALTER TABLE public.sequence_poses
ADD CONSTRAINT sequence_poses_custom_duration_seconds_check CHECK (custom_duration_seconds IS NULL OR (custom_duration_seconds > 0 AND custom_duration_seconds <= 7200)); -- Max 2 hours