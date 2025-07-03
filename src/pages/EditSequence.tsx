import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SequencePose {
  id: string;
  position: number;
  custom_duration_seconds: number | null;
  notes: string | null;
  pose_id: string;
  pose: Pose;
}

interface Sequence {
  id: string;
  name: string;
  duration_seconds: number;
  description: string;
}

const EditSequence = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [sequencePoses, setSequencePoses] = useState<SequencePose[]>([]);
  const [availablePoses, setAvailablePoses] = useState<Pose[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddPoseDialog, setShowAddPoseDialog] = useState(false);
  const [selectedPose, setSelectedPose] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_seconds: 0
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) {
      fetchSequence();
      fetchAvailablePoses();
    }
  }, [id]);

  const fetchSequence = async () => {
    try {
      // Fetch sequence details
      const { data: sequenceData, error: sequenceError } = await supabase
        .from('sequences')
        .select('*')
        .eq('id', id)
        .single();

      if (sequenceError) throw sequenceError;
      
      setSequence(sequenceData);
      setFormData({
        name: sequenceData.name,
        description: sequenceData.description || '',
        duration_seconds: sequenceData.duration_seconds
      });

      // Fetch sequence poses
      const { data: posesData, error: posesError } = await supabase
        .from('sequence_poses')
        .select(`
          *,
          pose:poses(*)
        `)
        .eq('sequence_id', id)
        .order('position');

      if (posesError) throw posesError;
      setSequencePoses(posesData || []);
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

  const fetchAvailablePoses = async () => {
    try {
      const { data, error } = await supabase
        .from('poses')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailablePoses(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading poses",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addPoseToSequence = async () => {
    if (!selectedPose) return;

    try {
      const nextPosition = sequencePoses.length > 0 
        ? Math.max(...sequencePoses.map(p => p.position)) + 1 
        : 1;

      const { data, error } = await supabase
        .from('sequence_poses')
        .insert({
          sequence_id: id!,
          pose_id: selectedPose,
          position: nextPosition
        })
        .select(`
          *,
          pose:poses(*)
        `)
        .single();

      if (error) throw error;

      setSequencePoses([...sequencePoses, data]);
      setSelectedPose('');
      setShowAddPoseDialog(false);
      
      toast({
        title: "Success",
        description: "Pose added to sequence",
      });
    } catch (error: any) {
      toast({
        title: "Error adding pose",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removePoseFromSequence = async (sequencePoseId: string) => {
    try {
      const { error } = await supabase
        .from('sequence_poses')
        .delete()
        .eq('id', sequencePoseId);

      if (error) throw error;

      setSequencePoses(sequencePoses.filter(p => p.id !== sequencePoseId));
      
      toast({
        title: "Success",
        description: "Pose removed from sequence",
      });
    } catch (error: any) {
      toast({
        title: "Error removing pose",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePoseDetails = async (sequencePoseId: string, updates: { custom_duration_seconds?: number | null, notes?: string | null }) => {
    try {
      const { error } = await supabase
        .from('sequence_poses')
        .update(updates)
        .eq('id', sequencePoseId);

      if (error) throw error;

      setSequencePoses(sequencePoses.map(p => 
        p.id === sequencePoseId ? { ...p, ...updates } : p
      ));
    } catch (error: any) {
      toast({
        title: "Error updating pose",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = sequencePoses.findIndex((pose) => pose.id === active.id);
      const newIndex = sequencePoses.findIndex((pose) => pose.id === over.id);

      const newSequencePoses = arrayMove(sequencePoses, oldIndex, newIndex);
      setSequencePoses(newSequencePoses);

      // Update positions in database
      try {
        const updates = newSequencePoses.map((pose, index) => ({
          id: pose.id,
          position: index + 1
        }));

        for (const update of updates) {
          await supabase
            .from('sequence_poses')
            .update({ position: update.position })
            .eq('id', update.id);
        }
      } catch (error: any) {
        toast({
          title: "Error updating pose order",
          description: error.message,
          variant: "destructive",
        });
        // Revert the change
        fetchSequence();
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Sequence name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sequences')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration_seconds: formData.duration_seconds
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sequence updated successfully",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error updating sequence",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading sequence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Basic Details - Full Width */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Basic Details</CardTitle>
            <CardDescription>Update your sequence information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Sequence Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter sequence name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })}
                  placeholder="Enter duration in seconds"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your sequence..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="zen"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Poses Management - Full Width */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Poses in Sequence</CardTitle>
                <CardDescription>{sequencePoses.length} poses</CardDescription>
              </div>
              <Dialog open={showAddPoseDialog} onOpenChange={setShowAddPoseDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pose
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Pose to Sequence</DialogTitle>
                    <DialogDescription>
                      Choose a pose to add to your sequence
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedPose} onValueChange={setSelectedPose}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pose" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePoses
                          .filter(pose => !sequencePoses.some(sp => sp.pose_id === pose.id))
                          .map((pose) => (
                          <SelectItem key={pose.id} value={pose.id}>
                            <div className="flex items-center gap-2">
                              <span>{pose.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {pose.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {pose.difficulty_level}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button 
                        onClick={addPoseToSequence}
                        disabled={!selectedPose}
                        variant="zen"
                      >
                        Add Pose
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddPoseDialog(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {sequencePoses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No poses in this sequence yet. Add some poses to get started.
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sequencePoses.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {sequencePoses.map((sequencePose) => (
                      <SortablePoseItem
                        key={sequencePose.id}
                        sequencePose={sequencePose}
                        onRemove={removePoseFromSequence}
                        onUpdateDetails={updatePoseDetails}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface SortablePoseItemProps {
  sequencePose: SequencePose;
  onRemove: (id: string) => void;
  onUpdateDetails: (id: string, updates: { custom_duration_seconds?: number | null, notes?: string | null }) => void;
}

const SortablePoseItem = ({ sequencePose, onRemove, onUpdateDetails }: SortablePoseItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: sequencePose.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 space-y-3 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </div>
          <div>
            <p className="font-medium">{sequencePose.pose.name}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {sequencePose.pose.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {sequencePose.pose.difficulty_level}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(sequencePose.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Custom Duration (seconds)</Label>
          <Input
            type="number"
            min="1"
            placeholder={`Default: ${sequencePose.pose.duration_seconds}s`}
            value={sequencePose.custom_duration_seconds || ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : null;
              onUpdateDetails(sequencePose.id, { custom_duration_seconds: value });
            }}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Personal Notes</Label>
          <Input
            placeholder="Add personal notes..."
            value={sequencePose.notes || ''}
            onChange={(e) => {
              onUpdateDetails(sequencePose.id, { notes: e.target.value || null });
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default EditSequence;