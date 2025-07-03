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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{sequence.name}</h1>
            <p className="text-muted-foreground">
              Pose {currentPoseIndex + 1} of {poses.length}
            </p>
          </div>
          <div></div>
        </div>

        {/* Fixed Header with Timer and Controls */}
        <div className="bg-white/90 backdrop-blur-sm shadow-gentle sticky top-0 z-10 mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{currentPose.pose.category}</Badge>
                <Badge variant="outline">{currentPose.pose.difficulty_level}</Badge>
              </div>
              <div className="text-4xl font-bold text-zen-blue">
                {formatTime(timeRemaining)}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPose}
                  disabled={currentPoseIndex === 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                {isPlaying ? (
                  <Button variant="zen" size="sm" onClick={handlePause}>
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="zen" size="sm" onClick={handlePlay}>
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPose}
                  disabled={isLastPose}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Practice Area */}
          <div className="lg:col-span-3">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold mb-2">{currentPose.pose.name}</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentPose.pose.description && (
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{currentPose.pose.description}</p>
                  </CardContent>
                </Card>
              )}
              
              {currentPose.pose.instructions && (
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{currentPose.pose.instructions}</p>
                  </CardContent>
                </Card>
              )}

              {currentPose.notes && (
                <Card className="shadow-card md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Personal Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{currentPose.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Compact Sequence Overview */}
          <div>
            <Card className="shadow-card sticky top-32">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sequence</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentPoseIndex + 1} of {poses.length}
                </p>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {poses.map((pose, index) => (
                    <div
                      key={pose.id}
                      className={`p-2 rounded-md border transition-zen cursor-pointer text-sm ${
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
                      <div className="flex justify-between items-center">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{pose.pose.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((pose.custom_duration_seconds || pose.pose.duration_seconds) / 60)}m {((pose.custom_duration_seconds || pose.pose.duration_seconds) % 60)}s
                          </p>
                        </div>
                        <div className="text-xs font-medium ml-2">
                          {index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeSequence;