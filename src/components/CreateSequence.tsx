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
  instructions: string;
  duration_seconds: number;
  difficulty_level: string;
  category: string;
  benefits: string;
  precautions: string;
}

interface SelectedPose extends Pose {
  position: number;
  custom_duration_seconds?: number;
}

interface CreateSequenceProps {
  user: User;
}

const CreateSequence = ({ user }: CreateSequenceProps) => {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [selectedPoses, setSelectedPoses] = useState<SelectedPose[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_seconds: 3600, // Default 60 minutes in seconds
    generated: false
  });
  const [loading, setLoading] = useState(false);
  const [posesLoading, setPosesLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPoses();
  }, []);


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

  const handleGenerateSequence = () => {
    if (poses.length === 0) {
      toast({
        title: "No poses available",
        description: "Please wait for poses to load before generating a sequence.",
        variant: "destructive",
      });
      return;
    }

    const targetDuration = formData.duration_seconds;
    let currentDuration = 0;
    const sequence: SelectedPose[] = [];
    let position = 1;

    // Simple sequence generation logic
    const availablePoses = [...poses];
    while (currentDuration < targetDuration * 0.9 && availablePoses.length > 0) {
      const randomIndex = Math.floor(Math.random() * availablePoses.length);
      const pose = availablePoses[randomIndex];
      
      if (currentDuration + pose.duration_seconds <= targetDuration) {
        sequence.push({ ...pose, position: position++ });
        currentDuration += pose.duration_seconds;
      }
      
      availablePoses.splice(randomIndex, 1);
    }

    setSelectedPoses(sequence);
    setFormData({ ...formData, generated: true });
    
    toast({
      title: "Sequence generated!",
      description: `Generated a ${Math.round(currentDuration / 60)} minute sequence with ${sequence.length} poses.`,
    });
  };

  const handleSaveSequence = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Sequence name required",
        description: "Please enter a name for your sequence.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: sequenceData, error: sequenceError } = await supabase
        .from('sequences')
        .insert({
          user_id: user.id,
          name: formData.name,
          duration_seconds: formData.duration_seconds,
          description: formData.description,
        })
        .select()
        .single();

      if (sequenceError) throw sequenceError;

      // Add poses to the sequence
      if (selectedPoses.length > 0) {
        const sequencePoses = selectedPoses.map(pose => ({
          sequence_id: sequenceData.id,
          pose_id: pose.id,
          position: pose.position,
          custom_duration_seconds: pose.custom_duration_seconds,
        }));

        const { error: posesError } = await supabase
          .from('sequence_poses')
          .insert(sequencePoses);

        if (posesError) throw posesError;
      }

      toast({
        title: "Sequence saved!",
        description: "Your yoga sequence has been created successfully.",
      });

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

  if (posesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
        <p className="text-muted-foreground">Loading poses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Create New Sequence</CardTitle>
            <CardDescription>Design your personalized yoga practice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Sequence Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Morning Flow"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.duration_seconds === 2700 ? "zen" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, duration_seconds: 2700, generated: false })}
                  >
                    45 min
                  </Button>
                  <Button
                    type="button"
                    variant={formData.duration_seconds === 3600 ? "zen" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, duration_seconds: 3600, generated: false })}
                  >
                    60 min
                  </Button>
                  <Button
                    type="button"
                    variant={formData.duration_seconds === 4500 ? "zen" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, duration_seconds: 4500, generated: false })}
                  >
                    75 min
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your sequence..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            
            {/* Generate Sequence Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Generate Sequence</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a {Math.round(formData.duration_seconds / 60)} minute sequence
                  </p>
                </div>
                <Button 
                  onClick={handleGenerateSequence}
                  variant="zen"
                  disabled={posesLoading}
                >
                  {formData.generated ? 'Regenerate Sequence' : 'Generate Sequence'}
                </Button>
              </div>
              
              {formData.generated && selectedPoses.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedPoses.map((pose, index) => (
                      <Card key={pose.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {pose.duration_seconds}s
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm">{pose.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{pose.category}</p>
                      </Card>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: {Math.round(selectedPoses.reduce((total, pose) => total + pose.duration_seconds, 0) / 60)} minutes
                    ({selectedPoses.length} poses)
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                onClick={handleSaveSequence} 
                variant="zen"
                disabled={loading || !formData.generated || selectedPoses.length === 0}
              >
                {loading ? 'Saving...' : 'Save Sequence'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateSequence;