import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';
import { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-sage-light/20 to-zen-blue-light/20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !session) {
    return <LandingPage />;
  }

  return <Dashboard user={user} session={session} />;
};

export default Index;
