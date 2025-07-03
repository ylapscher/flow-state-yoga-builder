import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CreateSequenceComponent from '@/components/CreateSequence';
import AuthForm from '@/components/AuthForm';
import { User, Session } from '@supabase/supabase-js';

const CreateSequencePage = () => {
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

  if (!user) {
    return <AuthForm />;
  }

  return <CreateSequenceComponent user={user} />;
};

export default CreateSequencePage;