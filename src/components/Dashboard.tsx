import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User, Session } from '@supabase/supabase-js';
import heroImage from '@/assets/yoga-hero.jpg';
interface Sequence {
  id: string;
  name: string;
  duration_seconds: number;
  description: string;
  created_at: string;
}
interface DashboardProps {
  user: User;
  session: Session;
}
const Dashboard = ({
  user,
  session
}: DashboardProps) => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    full_name: string | null;
  } | null>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchSequences();
    fetchUserProfile();
  }, []);
  const fetchUserProfile = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
      if (error) throw error;
      setUserProfile(data);
    } catch (error: any) {
      // Silently fail - will fallback to email
      console.error('Error loading profile:', error);
    }
  };
  const fetchSequences = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('sequences').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setSequences(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading sequences",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    try {
      // Clear any stored auth tokens
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Attempt to sign out (continue even if it fails)
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        console.warn('Sign out API call failed:', signOutError);
        // Continue with redirect even if API call fails
      }

      // Force redirect to clean state
      window.location.href = '/auth';
    } catch (error: any) {
      console.error('Error during sign out:', error);
      // Force redirect even on error
      window.location.href = '/auth';
    }
  };
  const handleCreateSequence = () => {
    // Navigate to create sequence page
    window.location.href = '/create-sequence';
  };
  const handleEditSequence = (sequenceId: string) => {
    window.location.href = `/edit-sequence/${sequenceId}`;
  };
  const handlePracticeSequence = (sequenceId: string) => {
    window.location.href = `/practice-sequence/${sequenceId}`;
  };
  
  const handleDeleteSequence = async (sequenceId: string, sequenceName: string) => {
    if (!confirm(`Are you sure you want to delete "${sequenceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // First delete sequence_poses (cascaded by RLS policies)
      const { error: posesError } = await supabase
        .from('sequence_poses')
        .delete()
        .eq('sequence_id', sequenceId);

      if (posesError) throw posesError;

      // Then delete the sequence
      const { error: sequenceError } = await supabase
        .from('sequences')
        .delete()
        .eq('id', sequenceId);

      if (sequenceError) throw sequenceError;

      // Update local state
      setSequences(sequences.filter(seq => seq.id !== sequenceId));
      
      toast({
        title: "Sequence deleted",
        description: `"${sequenceName}" has been deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting sequence",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img src={heroImage} alt="Yoga practice" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-sage-dark/80 to-zen-blue/60 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">Welcome to Yoga Flow</h1>
            <p className="text-xl opacity-90">Create personalized yoga sequences</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-gentle sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-sage-dark">Yoga Flow</h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {userProfile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Your Yoga Sequences</h2>
            <p className="text-muted-foreground mt-2">Create and manage your personalized yoga practices</p>
          </div>
          <Button onClick={handleCreateSequence} variant="zen" size="lg">
            Create New Sequence
          </Button>
        </div>

        {loading ? <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your sequences...</p>
          </div> : sequences.length === 0 ? <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-card p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">No sequences yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your yoga journey by creating your first personalized sequence.
              </p>
              <Button onClick={handleCreateSequence} variant="zen">
                Create Your First Sequence
              </Button>
            </div>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sequences.map(sequence => <Card key={sequence.id} className="shadow-card hover:shadow-lg transition-zen cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{sequence.name}</CardTitle>
                      <CardDescription className="mt-1">{sequence.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {Math.round(sequence.duration_seconds / 60)} min
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSequence(sequence.id, sequence.name);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(sequence.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditSequence(sequence.id)}>
                      Edit
                    </Button>
                    <Button variant="zen" size="sm" className="flex-1" onClick={() => handlePracticeSequence(sequence.id)}>
                      Practice
                    </Button>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>;
};
export default Dashboard;