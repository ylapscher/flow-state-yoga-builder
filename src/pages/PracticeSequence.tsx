import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface Sequence {
  id: string;
  name: string;
  duration_seconds: number;
  description: string;
}

interface SequencePose {
  id: string;
  position: number;
  custom_duration_seconds: number | null;
  notes: string | null;
  pose: {
    id: string;
    name: string;
    description: string;
    instructions: string;
    duration_seconds: number;
    difficulty_level: string;
    category: string;
  };
}

const PracticeSequence = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [poses, setPoses] = useState<SequencePose[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (id) {
      fetchSequenceData();
    }
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleNextPose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  const fetchSequenceData = async () => {
    try {
      // Fetch sequence details
      const { data: sequenceData, error: sequenceError } = await supabase
        .from('sequences')
        .select('*')
        .eq('id', id)
        .single();

      if (sequenceError) throw sequenceError;
      setSequence(sequenceData);

      // Fetch sequence poses with pose details
      const { data: posesData, error: posesError } = await supabase
        .from('sequence_poses')
        .select(`
          *,
          pose:poses(*)
        `)
        .eq('sequence_id', id)
        .order('position');

      if (posesError) throw posesError;
      setPoses(posesData || []);

      // Set initial timer for first pose
      if (posesData && posesData.length > 0) {
        const firstPose = posesData[0];
        const duration = firstPose.custom_duration_seconds || firstPose.pose.duration_seconds;
        setTimeRemaining(duration); // Already in seconds
      }
    } catch (error: any) {
      toast({
        title: "Error loading sequence",
        description: error.message,
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleNextPose = () => {
    if (currentPoseIndex < poses.length - 1) {
      const nextIndex = currentPoseIndex + 1;
      setCurrentPoseIndex(nextIndex);
      const nextPose = poses[nextIndex];
      const duration = nextPose.custom_duration_seconds || nextPose.pose.duration_seconds;
      setTimeRemaining(duration); // Already in seconds
      setIsPlaying(false);
    } else {
      // Sequence completed
      setIsPlaying(false);
      toast({
        title: "Practice Complete!",
        description: "Congratulations on completing your yoga sequence.",
      });
    }
  };

  const handlePreviousPose = () => {
    if (currentPoseIndex > 0) {
      const prevIndex = currentPoseIndex - 1;
      setCurrentPoseIndex(prevIndex);
      const prevPose = poses[prevIndex];
      const duration = prevPose.custom_duration_seconds || prevPose.pose.duration_seconds;
      setTimeRemaining(duration); // Already in seconds
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading practice session...</p>
      </div>
    );
  }

  if (!sequence || poses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Poses Found</CardTitle>
            <CardDescription>This sequence doesn't have any poses yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} variant="zen">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPose = poses[currentPoseIndex];
  const isLastPose = currentPoseIndex === poses.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile-optimized header */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="text-center flex-1 mx-2">
            <h1 className="text-lg sm:text-2xl font-bold truncate">{sequence.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pose {currentPoseIndex + 1} of {poses.length}
            </p>
          </div>
          <div className="w-16 sm:w-0"></div>
        </div>

        {/* Mobile-optimized sticky header with timer and controls */}
        <div className="bg-white/95 backdrop-blur-sm shadow-gentle sticky top-0 z-10 mb-4 sm:mb-6 rounded-lg border">
          <div className="px-3 sm:px-6 py-3 sm:py-4">
            {/* Mobile layout: stack vertically on small screens */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              {/* Badges row */}
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4">
                <Badge variant="secondary" className="text-xs">{currentPose.pose.category}</Badge>
                <Badge variant="outline" className="text-xs">{currentPose.pose.difficulty_level}</Badge>
              </div>
              
              {/* Timer - prominent on mobile */}
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-zen-blue">
                  {formatTime(timeRemaining)}
                </div>
              </div>
              
              {/* Controls - centered on mobile */}
              <div className="flex justify-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPose}
                  disabled={currentPoseIndex === 0}
                  className="p-2 sm:p-3"
                >
                  <SkipBack className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                {isPlaying ? (
                  <Button variant="zen" size="sm" onClick={handlePause} className="p-2 sm:p-3">
                    <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                ) : (
                  <Button variant="zen" size="sm" onClick={handlePlay} className="p-2 sm:p-3">
                    <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPose}
                  disabled={isLastPose}
                  className="p-2 sm:p-3"
                >
                  <SkipForward className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Main Practice Area */}
          <div>
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-4xl font-bold mb-2 px-2">{currentPose.pose.name}</h1>
            </div>
            
            {/* Mobile-first grid layout */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {currentPose.pose.description && (
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{currentPose.pose.description}</p>
                  </CardContent>
                </Card>
              )}
              
              {currentPose.pose.instructions && (
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{currentPose.pose.instructions}</p>
                  </CardContent>
                </Card>
              )}

              {currentPose.notes && (
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Personal Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{currentPose.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Mobile-optimized Sequence Overview */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Sequence Overview</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {currentPoseIndex + 1} of {poses.length}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {/* Horizontal scroll on mobile, grid on larger screens */}
              <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:gap-3 sm:overflow-visible sm:pb-0">
                {poses.map((pose, index) => (
                  <div
                    key={pose.id}
                    className={`flex-shrink-0 w-24 sm:w-auto p-2 sm:p-3 rounded-md border transition-zen cursor-pointer ${
                      index === currentPoseIndex
                        ? 'bg-zen-blue-light border-zen-blue'
                        : 'bg-background hover:bg-muted'
                    }`}
                    onClick={() => {
                      setCurrentPoseIndex(index);
                      const duration = pose.custom_duration_seconds || pose.pose.duration_seconds;
                      setTimeRemaining(duration);
                      setIsPlaying(false);
                    }}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium mb-1 text-muted-foreground">
                        {index + 1}
                      </div>
                      <p className="font-medium text-xs sm:text-sm mb-1 line-clamp-2 leading-tight">{pose.pose.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((pose.custom_duration_seconds || pose.pose.duration_seconds) / 60)}m {((pose.custom_duration_seconds || pose.pose.duration_seconds) % 60)}s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PracticeSequence;