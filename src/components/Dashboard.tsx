import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const Dashboard = ({ user, session }: DashboardProps) => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const { data, error } = await supabase
        .from('sequences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSequences(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading sequences",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      window.location.href = '/auth';
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Yoga practice" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sage-dark/80 to-zen-blue/60 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">Welcome to Yoga Flow</h1>
            <p className="text-xl opacity-90">Create personalized yoga sequences for every moment</p>
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
              <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your sequences...</p>
          </div>
        ) : sequences.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-card p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">No sequences yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your yoga journey by creating your first personalized sequence.
              </p>
              <Button onClick={handleCreateSequence} variant="zen">
                Create Your First Sequence
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sequences.map((sequence) => (
              <Card key={sequence.id} className="shadow-card hover:shadow-lg transition-zen cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{sequence.name}</CardTitle>
                    <Badge variant="secondary">
                      {Math.round(sequence.duration_seconds / 60)} min
                    </Badge>
                  </div>
                  <CardDescription>{sequence.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(sequence.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditSequence(sequence.id)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="zen" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePracticeSequence(sequence.id)}
                    >
                      Practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;