-- First, change the column types to handle larger values for seconds
ALTER TABLE public.poses 
ALTER COLUMN duration_minutes TYPE integer;

ALTER TABLE public.sequences
ALTER COLUMN duration_minutes TYPE integer;

ALTER TABLE public.sequence_poses
ALTER COLUMN custom_duration_minutes TYPE integer;

-- Now update the values to convert minutes to seconds
UPDATE public.poses 
SET duration_minutes = duration_minutes * 60
WHERE duration_minutes IS NOT NULL;

UPDATE public.sequences 
SET duration_minutes = duration_minutes * 60
WHERE duration_minutes IS NOT NULL;

UPDATE public.sequence_poses 
SET custom_duration_minutes = custom_duration_minutes * 60
WHERE custom_duration_minutes IS NOT NULL;

-- Finally, rename the columns to reflect they now store seconds
ALTER TABLE public.poses 
RENAME COLUMN duration_minutes TO duration_seconds;

ALTER TABLE public.sequences
RENAME COLUMN duration_minutes TO duration_seconds;

ALTER TABLE public.sequence_poses
RENAME COLUMN custom_duration_minutes TO custom_duration_seconds;