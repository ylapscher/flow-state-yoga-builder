import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface Pose {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  difficulty_level: string;
  category: string;
  instructions: string;
  benefits: string;
}

interface SelectedPose extends Pose {
  position: number;
  custom_duration_minutes?: number;
}

interface CreateSequenceProps {
  user: User;
}

const CreateSequence = ({ user }: CreateSequenceProps) => {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [selectedPoses, setSelectedPoses] = useState<SelectedPose[]>([]);
  const [sequenceName, setSequenceName] = useState('');
  const [sequenceDescription, setSequenceDescription] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [posesLoading, setPosesLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPoses();
  }, []);

  useEffect(() => {
    if (duration) {
      generateSequence();
    }
  }, [duration, poses]);

  const fetchPoses = async () => {
    try {
      const { data, error } = await supabase
        .from('poses')
        .select('*')
        .order('name');

      if (error) throw error;
      setPoses(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading poses",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPosesLoading(false);
    }
  };

  const generateSequence = () => {
    if (poses.length === 0) return;

    const targetDuration = duration;
    let currentDuration = 0;
    const sequence: SelectedPose[] = [];
    let position = 1;

    // Always start with Mountain Pose if available
    const mountainPose = poses.find(p => p.name.toLowerCase().includes('mountain'));
    if (mountainPose) {
      sequence.push({ ...mountainPose, position: position++ });
      currentDuration += mountainPose.duration_minutes;
    }

    // Add warm-up poses (Cat-Cow, gentle stretches)
    const warmUpPoses = poses.filter(p => 
      p.category === 'core' || 
      (p.difficulty_level === 'beginner' && p.category !== 'relaxation')
    );
    
    for (const pose of warmUpPoses.slice(0, 2)) {
      if (currentDuration + pose.duration_minutes < targetDuration * 0.8) {
        sequence.push({ ...pose, position: position++ });
        currentDuration += pose.duration_minutes;
      }
    }

    // Add main sequence poses based on difficulty and variety
    const mainPoses = poses.filter(p => 
      p.category !== 'relaxation' && 
      !sequence.some(sp => sp.id === p.id)
    );

    // Mix different categories for a balanced practice
    const categories = ['standing', 'balance', 'backbend', 'forward_fold', 'twist'];
    
    for (const category of categories) {
      const categoryPoses = mainPoses.filter(p => p.category === category);
      if (categoryPoses.length > 0 && currentDuration < targetDuration * 0.9) {
        const pose = categoryPoses[Math.floor(Math.random() * categoryPoses.length)];
        if (!sequence.some(sp => sp.id === pose.id)) {
          sequence.push({ ...pose, position: position++ });
          currentDuration += pose.duration_minutes;
        }
      }
    }

    // Add remaining poses to fill time
    const remainingPoses = poses.filter(p => 
      !sequence.some(sp => sp.id === p.id) && 
      p.category !== 'relaxation'
    );

    for (const pose of remainingPoses) {
      if (currentDuration + pose.duration_minutes <= targetDuration * 0.95) {
        sequence.push({ ...pose, position: position++ });
        currentDuration += pose.duration_minutes;
      }
    }

    // Always end with relaxation
    const savasana = poses.find(p => p.name.toLowerCase().includes('savasana') || p.category === 'relaxation');
    if (savasana) {
      sequence.push({ ...savasana, position: position++ });
      currentDuration += savasana.duration_minutes;
    }

    setSelectedPoses(sequence);
  };

  const getTotalDuration = () => {
    return selectedPoses.reduce((total, pose) => {
      return total + (pose.custom_duration_minutes || pose.duration_minutes);
    }, 0);
  };

  const handleSaveSequence = async () => {
    if (!sequenceName.trim()) {
      toast({
        title: "Sequence name required",
        description: "Please enter a name for your sequence.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPoses.length === 0) {
      toast({
        title: "No poses selected",
        description: "Please add some poses to your sequence.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the sequence
      const { data: sequenceData, error: sequenceError } = await supabase
        .from('sequences')
        .insert({
          user_id: user.id,
          name: sequenceName,
          duration_minutes: duration,
          description: sequenceDescription,
        })
        .select()
        .single();

      if (sequenceError) throw sequenceError;

      // Add poses to the sequence
      const sequencePoses = selectedPoses.map(pose => ({
        sequence_id: sequenceData.id,
        pose_id: pose.id,
        position: pose.position,
        custom_duration_minutes: pose.custom_duration_minutes,
      }));

      const { error: posesError } = await supabase
        .from('sequence_poses')
        .insert(sequencePoses);

      if (posesError) throw posesError;

      toast({
        title: "Sequence saved!",
        description: "Your yoga sequence has been created successfully.",
      });

      // Navigate back to dashboard
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error saving sequence",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    window.location.href = '/';
  };

  if (posesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
        <p className="text-muted-foreground">Loading poses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-gentle sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-sage-dark">Create Sequence</h2>
            </div>
            <Button variant="outline" onClick={handleBackToDashboard}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sequence Settings */}
          <div className="lg:col-span-1">
            <Card className="shadow-card sticky top-24">
              <CardHeader>
                <CardTitle>Sequence Details</CardTitle>
                <CardDescription>Configure your yoga practice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Sequence Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Morning Flow"
                    value={sequenceName}
                    onChange={(e) => setSequenceName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="75">75 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your sequence..."
                    value={sequenceDescription}
                    onChange={(e) => setSequenceDescription(e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Generated Sequence</span>
                    <Badge variant="secondary">
                      {getTotalDuration().toFixed(1)} min
                    </Badge>
                  </div>
                  <Button 
                    onClick={generateSequence} 
                    variant="outline" 
                    className="w-full"
                  >
                    Regenerate Sequence
                  </Button>
                </div>

                <Button 
                  onClick={handleSaveSequence} 
                  variant="zen" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Sequence'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Sequence */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Your Yoga Sequence</CardTitle>
                <CardDescription>
                  Generated sequence for {duration} minutes of practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPoses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No poses generated yet. Select a duration to get started.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedPoses.map((pose, index) => (
                      <div 
                        key={pose.id} 
                        className="flex items-start space-x-4 p-4 rounded-lg bg-gradient-to-r from-sage-light/20 to-zen-blue-light/20 border border-sage-light/40"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{pose.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{pose.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {pose.duration_minutes} min
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {pose.difficulty_level}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {pose.category.replace('_', ' ')}
                            </Badge>
                          </div>
                          {pose.instructions && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {pose.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSequence;